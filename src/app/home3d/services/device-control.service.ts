import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export type ToggleResultStatus = 'confirmed' | 'unknown';

export interface ToggleResult {
  desiredOn: boolean;
  status: ToggleResultStatus;
}

type DeviceItem = {
  id: string;
  isOn: boolean;
  updatedAt: string | null;
};

type RoomDevices = {
  roomId: string;
  roomName: string;
  devices: DeviceItem[];
};

@Injectable({
  providedIn: 'root'
})
export class DeviceControlService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api';

  private readonly freshnessWindowMs = 20_000;

  async toggleById(deviceId: string, desiredOn: boolean): Promise<ToggleResult> {
    await firstValueFrom(
      this.http.post(`${this.api}/device-states/${deviceId}/power`, {
        on: desiredOn
      })
    );

    const confirmed = await this.pollUntilDeviceStateMatches(deviceId, desiredOn);

    return {
      desiredOn,
      status: confirmed ? 'confirmed' : 'unknown'
    };
  }

  private async pollUntilDeviceStateMatches(
    deviceId: string,
    desiredOn: boolean
  ): Promise<boolean> {
    const delays = [400, 700, 1000, 1500, 2200];
    const requestTimeoutMs = 4000;

    for (const delay of delays) {
      await this.wait(delay);

      try {
        const rooms = await this.fetchDevicesByRoom(requestTimeoutMs);
        const device = this.findDeviceById(rooms, deviceId);

        if (device && this.isDesiredStateFresh(device, desiredOn)) {
          return true;
        }
      } catch (err) {
        console.error('Failed to refresh devices during polling:', err);
      }
    }

    return false;
  }

  private async fetchDevicesByRoom(requestTimeoutMs: number): Promise<RoomDevices[]> {
    return await firstValueFrom(
      this.http.get<RoomDevices[]>(`${this.api}/homes/devices-by-room`).pipe(
        timeout(requestTimeoutMs)
      )
    );
  }

  private findDeviceById(rooms: RoomDevices[], deviceId: string): DeviceItem | null {
    for (const room of rooms) {
      const found = room.devices.find((device) => device.id === deviceId);

      if (found) {
        return found;
      }
    }

    return null;
  }

  private isDesiredStateFresh(device: DeviceItem, desiredOn: boolean): boolean {
    if (device.isOn !== desiredOn) {
      return false;
    }

    return this.isFresh(device.updatedAt);
  }

  private isFresh(updatedAt: string | null): boolean {
    if (!updatedAt) {
      return false;
    }

    const updatedTime = new Date(updatedAt).getTime();

    if (Number.isNaN(updatedTime)) {
      return false;
    }

    return Date.now() - updatedTime <= this.freshnessWindowMs;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
