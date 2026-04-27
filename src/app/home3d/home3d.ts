import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

import { HomeSceneComponent } from './scene/home-scene.component';
import { DeviceControlService } from './services/device-control.service';
import { Home3dLayoutStore } from './services/home3d-layout.store';

type DeviceCardStatus = 'ON' | 'OFF' | 'PENDING' | 'UNKNOWN';

@Component({
  selector: 'app-home3d',
  standalone: true,
  imports: [CommonModule, HomeSceneComponent],
  templateUrl: './home3d.html',
  styleUrl: './home3d.css'
})
export class Home3d implements OnInit {
  private readonly layoutStore = inject(Home3dLayoutStore);
  private readonly deviceControl = inject(DeviceControlService);

  readonly rooms = computed(() => this.layoutStore.rooms());
  readonly currentRoom = computed(() => this.layoutStore.currentRoom());
  readonly isLoadingRooms = computed(() => this.layoutStore.isLoading());
  readonly errorMessage = computed(() => this.layoutStore.error());

  selectedDeviceName = '';
  selectedDeviceStatus: DeviceCardStatus = 'OFF';
  showDeviceCard = false;

  private pendingDeviceIds = new Set<string>();
  private hideCardTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.layoutStore.loadLayouts();
  }

  selectRoom(roomId: string): void {
    if (roomId === this.layoutStore.currentRoomId()) {
      return;
    }

    this.layoutStore.selectRoom(roomId);
    this.hideDeviceCard();
  }

  onDeviceSelected(device: THREE.Object3D): void {
    const deviceId = device.userData['deviceId'];

    if (!deviceId || this.pendingDeviceIds.has(deviceId)) {
      return;
    }

    const previousState = !!device.userData['isOn'];
    const desiredOn = !previousState;

    this.pendingDeviceIds.add(deviceId);

    this.selectedDeviceName = device.name || 'Device';
    this.selectedDeviceStatus = 'PENDING';
    this.showDeviceCard = true;
    this.clearHideTimer();

    this.applyVisualState(device, desiredOn);

    this.deviceControl.toggleById(deviceId, desiredOn)
      .then((result) => {
        if (result.status === 'confirmed') {
          this.applyVisualState(device, result.desiredOn);
          this.selectedDeviceStatus = result.desiredOn ? 'ON' : 'OFF';
        } else {
          this.selectedDeviceStatus = 'UNKNOWN';
        }
      })
      .catch((err) => {
        console.error('Failed to toggle device:', err);

        this.applyVisualState(device, previousState);
        this.selectedDeviceStatus = 'UNKNOWN';
      })
      .finally(() => {
        this.pendingDeviceIds.delete(deviceId);
        this.scheduleHideDeviceCard();
      });
  }

  onSelectionCleared(): void {
    // No panel to clear.
  }

  onRoomLoaded(): void {
    // Reserved for future UI feedback.
  }

  getDeviceCardSubtitle(): string {
    switch (this.selectedDeviceStatus) {
      case 'ON':
        return 'Device is on';
      case 'OFF':
        return 'Device is off';
      case 'PENDING':
        return 'Changing device state...';
      case 'UNKNOWN':
        return 'Device state update is delayed';
    }
  }

  private applyVisualState(device: THREE.Object3D, isOn: boolean): void {
    device.userData['isOn'] = isOn;

    const light = device.userData['light'] as THREE.SpotLight | null;

    if (light) {
      light.intensity = isOn ? (device.userData['defaultIntensity'] ?? 18) : 0;
    }
  }

  private scheduleHideDeviceCard(): void {
    this.clearHideTimer();

    this.hideCardTimer = setTimeout(() => {
      this.showDeviceCard = false;
    }, 3000);
  }

  private hideDeviceCard(): void {
    this.clearHideTimer();
    this.showDeviceCard = false;
  }

  private clearHideTimer(): void {
    if (this.hideCardTimer) {
      clearTimeout(this.hideCardTimer);
      this.hideCardTimer = null;
    }
  }
}
