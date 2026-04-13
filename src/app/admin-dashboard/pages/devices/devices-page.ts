import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface DeviceItem {
  id: string;
  name: string;
  roomId?: string;
  roomName?: string;
  deviceTypeId?: string;
  deviceTypeName?: string;
  externalId?: string | null;
  model?: string | null;
  firmwareVersion?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devices-page.html',
  styleUrl: './devices-page.css'
})
export class DevicesPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  devices: DeviceItem[] = [];

  isLoading = false;
  isDeleting = false;
  errorMessage = '';

  isDeleteModalOpen = false;
  deviceToDelete: DeviceItem | null = null;

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<DeviceItem[]>('/api/devices/my').subscribe({
      next: (devices) => {
        this.ngZone.run(() => {
          this.devices = devices ?? [];
          this.isLoading = false;
          this.errorMessage = '';
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load devices', error);

        this.ngZone.run(() => {
          this.devices = [];
          this.isLoading = false;
          this.errorMessage = 'Failed to load devices';
          this.cdr.detectChanges();
        });
      }
    });
  }

  openDeleteModal(device: DeviceItem): void {
    if (this.isDeleting) {
      return;
    }

    this.deviceToDelete = device;
    this.errorMessage = '';
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleteModalOpen = false;
    this.deviceToDelete = null;
  }

  deleteDevice(): void {
    if (!this.deviceToDelete || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    this.http.delete(`/api/devices/${this.deviceToDelete.id}`).subscribe({
      next: () => {
        this.ngZone.run(() => {
          const deletedId = this.deviceToDelete?.id;
          this.devices = this.devices.filter(device => device.id !== deletedId);
          this.isDeleting = false;
          this.closeDeleteModal();
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to delete device', error);

        this.ngZone.run(() => {
          this.isDeleting = false;
          this.errorMessage = 'Failed to delete device';
          this.cdr.detectChanges();
        });
      }
    });
  }

  trackByDevice(index: number, device: DeviceItem): string {
    return device.id;
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  getDeviceTypeLabel(device: DeviceItem): string {
    return device.deviceTypeName || 'Unknown type';
  }

  getRoomLabel(device: DeviceItem): string {
    return device.roomName || 'No room';
  }
}
