import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

type DeviceItem = {
  id: string;
  name: string;
  type: string;
  room: string;
  power: number;
  basePower: number;
  isOn: boolean;
  online: boolean;
  updatedAt: string | null;
};

type RoomDevices = {
  roomId: string;
  roomName: string;
  activeDevices: number;
  totalPower: number;
  devices: DeviceItem[];
};

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devices.html',
  styleUrl: './devices.css'
})
export class Devices implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = '/api';

  rooms: RoomDevices[] = [];
  loading = false;
  error = '';

  // устройства, по которым ждём подтверждение
  pendingDeviceIds = new Set<string>();

  // устройства, по которым не удалось подтвердить новое состояние
  unknownDeviceIds = new Set<string>();

  ngOnInit(): void {
    setTimeout(() => {
      this.loadDevices();
    });
  }

  loadDevices(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.http.get<RoomDevices[]>(`${this.apiUrl}/homes/devices-by-room`)
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms ?? [];
          this.loading = false;
          this.error = '';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load devices:', err);
          this.error = 'Failed to load devices';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  toggleDevice(device: DeviceItem): void {
    if (this.isDevicePending(device.id)) {
      return;
    }

    this.pendingDeviceIds.add(device.id);
    this.unknownDeviceIds.delete(device.id);
    this.error = '';
    this.cdr.detectChanges();

    const previousIsOn = device.isOn;

    this.http.post(`${this.apiUrl}/device-states/${device.id}/toggle`, {})
      .subscribe({
        next: async () => {
          try {
            const confirmed = await this.pollUntilDeviceStateChanges(device.id, previousIsOn);

            if (!confirmed) {
              this.unknownDeviceIds.add(device.id);
            }
          } catch (err) {
            console.error('Polling after toggle failed:', err);
            this.error = 'Device status update is delayed';
            this.unknownDeviceIds.add(device.id);
          } finally {
            this.pendingDeviceIds.delete(device.id);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Failed to toggle device:', err);
          this.error = 'Failed to toggle device';
          this.pendingDeviceIds.delete(device.id);
          this.unknownDeviceIds.add(device.id);
          this.cdr.detectChanges();
        }
      });
  }

  private async pollUntilDeviceStateChanges(deviceId: string, previousIsOn: boolean): Promise<boolean> {
    const delays = [500, 900, 1300, 1800, 2500];
    const requestTimeoutMs = 4000;

    for (const delay of delays) {
      await this.wait(delay);

      try {
        const rooms = await this.fetchDevicesByRoom(requestTimeoutMs);
        this.rooms = rooms;
        this.cdr.detectChanges();

        const updatedDevice = this.findDeviceById(deviceId);

        if (updatedDevice && updatedDevice.isOn !== previousIsOn) {
          this.unknownDeviceIds.delete(deviceId);
          return true;
        }
      } catch (err) {
        console.error('Failed to refresh devices during polling:', err);
      }
    }

    // Финальный refresh перед тем как признать состояние неподтвержденным
    try {
      const rooms = await this.fetchDevicesByRoom(requestTimeoutMs);
      this.rooms = rooms;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Final refresh after polling failed:', err);
    }

    return false;
  }

  private async fetchDevicesByRoom(requestTimeoutMs: number): Promise<RoomDevices[]> {
    return await firstValueFrom(
      this.http.get<RoomDevices[]>(`${this.apiUrl}/homes/devices-by-room`).pipe(
        timeout(requestTimeoutMs)
      )
    );
  }

  private findDeviceById(deviceId: string): DeviceItem | null {
    for (const room of this.rooms) {
      const found = room.devices.find(device => device.id === deviceId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isDevicePending(deviceId: string): boolean {
    return this.pendingDeviceIds.has(deviceId);
  }

  isDeviceUnknown(deviceId: string): boolean {
    return this.unknownDeviceIds.has(deviceId);
  }

  trackByRoom(index: number, room: RoomDevices): string {
    return room.roomId;
  }

  trackByDevice(index: number, device: DeviceItem): string {
    return device.id;
  }

  formatUpdatedAt(value: string | null): string {
    if (!value) {
      return 'No updates';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }
}
