import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface DeviceItem {
  id: string;
  name: string;
  roomName?: string;
  deviceTypeId?: string;
  deviceTypeCode?: string;
  deviceTypeName?: string;
  externalId?: string | null;
  model?: string | null;
  firmwareVersion?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BindDeviceConnectionRequest {
  provider: 'SHELLY';
  connectionType: 'LOCAL_HTTP';
  ipAddress: string;
  port: number;
  isEnabled: boolean;
}

@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  isBinding = false;
  errorMessage = '';

  isDeleteModalOpen = false;
  deviceToDelete: DeviceItem | null = null;

  isBindPanelOpen = false;
  deviceToBind: DeviceItem | null = null;

  bindForm: BindDeviceConnectionRequest = this.createDefaultBindForm();

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

  openBindPanel(device: DeviceItem): void {
    if (this.isBinding) {
      return;
    }

    this.deviceToBind = device;
    this.bindForm = this.createDefaultBindForm();
    this.errorMessage = '';
    this.isBindPanelOpen = true;
  }

  closeBindPanel(): void {
    if (this.isBinding) {
      return;
    }

    this.isBindPanelOpen = false;
    this.deviceToBind = null;
    this.bindForm = this.createDefaultBindForm();
  }

  bindDevice(): void {
    if (!this.deviceToBind || this.isBinding) {
      return;
    }

    if (!this.bindForm.ipAddress.trim()) {
      this.errorMessage = 'IP address is required';
      this.cdr.detectChanges();
      return;
    }

    this.isBinding = true;
    this.errorMessage = '';

    const payload: BindDeviceConnectionRequest = {
      provider: 'SHELLY',
      connectionType: 'LOCAL_HTTP',
      ipAddress: this.bindForm.ipAddress.trim(),
      port: this.bindForm.port || 80,
      isEnabled: true
    };

    this.http.put(`/api/device-connections/device/${this.deviceToBind.id}`, payload).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.isBinding = false;
          this.closeBindPanel();
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to bind device', error);

        this.ngZone.run(() => {
          this.isBinding = false;
          this.errorMessage = 'Failed to bind device';
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

  private createDefaultBindForm(): BindDeviceConnectionRequest {
    return {
      provider: 'SHELLY',
      connectionType: 'LOCAL_HTTP',
      ipAddress: '',
      port: 80,
      isEnabled: true
    };
  }
}
