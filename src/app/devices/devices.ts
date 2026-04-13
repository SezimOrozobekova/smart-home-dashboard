import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

type DeviceItem = {
  id: string;
  name: string;
  type: string;
  room: string;
  power: number;
  basePower: number;
  active: boolean;
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
  toggling = false;
  error = '';

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
          this.rooms = rooms;
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
    if (this.toggling) {
      return;
    }

    this.toggling = true;
    this.error = '';
    this.cdr.detectChanges();

    this.http.post(`${this.apiUrl}/device-states/${device.id}/toggle`, {}).subscribe({
      next: () => {
        this.reloadDevicesByRoom();
      },
      error: (err) => {
        console.error('Failed to toggle device:', err);
        this.error = 'Failed to toggle device';
        this.toggling = false;
        this.cdr.detectChanges();
      }
    });
  }

  reloadDevicesByRoom(): void {
    this.http
      .get<RoomDevices[]>(`${this.apiUrl}/homes/devices-by-room`)
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms;
          this.toggling = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to reload devices:', err);
          this.error = 'Failed to refresh devices';
          this.toggling = false;
          this.cdr.detectChanges();
        }
      });
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
