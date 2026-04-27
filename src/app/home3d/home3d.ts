import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

import { HomeSceneComponent } from './scene/home-scene.component';
import { DeviceControlService } from './services/device-control.service';
import { Home3dLayoutStore } from './services/home3d-layout.store';

@Component({
  selector: 'app-home3d',
  standalone: true,
  imports: [CommonModule, HomeSceneComponent],
  templateUrl: './home3d.html',
  styleUrl: './home3d.css'
})
export class Home3d implements OnInit {
  private layoutStore = inject(Home3dLayoutStore);
  private deviceControl = inject(DeviceControlService);

  readonly rooms = computed(() => this.layoutStore.rooms());
  readonly currentRoom = computed(() => this.layoutStore.currentRoom());
  readonly isLoadingRooms = computed(() => this.layoutStore.isLoading());
  readonly errorMessage = computed(() => this.layoutStore.error());

  selectedDeviceName = '';
  selectedDeviceState = false;
  showDeviceCard = false;

  ngOnInit(): void {
    this.layoutStore.loadLayouts();
  }

  selectRoom(roomId: string): void {
    this.layoutStore.selectRoom(roomId);
  }

  onDeviceSelected(device: THREE.Object3D): void {
    const deviceId = device.userData['deviceId'];
    if (!deviceId) return;

    const desiredOn = !device.userData['isOn'];

    this.selectedDeviceName = device.name || 'Device';
    this.selectedDeviceState = desiredOn;
    this.showDeviceCard = true;

    this.deviceControl.toggleById(deviceId, desiredOn)
      .then((finalState) => {
        this.applyVisualState(device, finalState);
      })
      .catch((err) => {
        console.error(err);
        this.applyVisualState(device, !desiredOn);
      });

    setTimeout(() => {
      this.showDeviceCard = false;
    }, 2500);
  }

  private applyVisualState(device: THREE.Object3D, isOn: boolean): void {
    device.userData['isOn'] = isOn;

    const light = device.userData['light'] as THREE.SpotLight | null;

    if (light) {
      light.intensity = isOn ? (device.userData['defaultIntensity'] ?? 18) : 0;
    }
  }
}
