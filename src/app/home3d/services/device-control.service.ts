import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

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
  private http = inject(HttpClient);
  private api = '/api';

  private readonly freshnessWindowMs = 20_000;

  async toggleById(deviceId: string, desiredOn: boolean): Promise<boolean> {
    await firstValueFrom(
      this.http.post(`${this.api}/device-states/${deviceId}/power`, {
        on: desiredOn
      })
    );

    const confirmed = await this.pollUntilMatches(deviceId, desiredOn);

    return confirmed ? desiredOn : desiredOn;
  }

  private async pollUntilMatches(deviceId: string, desiredOn: boolean): Promise<boolean> {
    const delays = [400, 700, 1000, 1500, 2200];

    for (const delay of delays) {
      await this.wait(delay);

      try {
        const rooms = await this.fetchDevices();
        const device = this.findDevice(rooms, deviceId);

        if (device && this.isDesiredFresh(device, desiredOn)) {
          return true;
        }
      } catch (e) {
        console.error('poll error', e);
      }
    }

    return false;
  }

  private async fetchDevices(): Promise<RoomDevices[]> {
    return await firstValueFrom(
      this.http.get<RoomDevices[]>(`${this.api}/homes/devices-by-room`)
        .pipe(timeout(4000))
    );
  }

  private findDevice(rooms: RoomDevices[], id: string): DeviceItem | null {
    for (const r of rooms) {
      const d = r.devices.find(x => x.id === id);
      if (d) return d;
    }
    return null;
  }

  private isDesiredFresh(device: DeviceItem, desiredOn: boolean): boolean {
    if (device.isOn !== desiredOn) return false;
    if (!device.updatedAt) return false;

    const t = new Date(device.updatedAt).getTime();
    if (Number.isNaN(t)) return false;

    return Date.now() - t <= this.freshnessWindowMs;
  }

  private wait(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}
