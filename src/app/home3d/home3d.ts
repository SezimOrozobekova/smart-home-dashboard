import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

import { DevicePanelHostComponent } from './panels/device-panel-host.component';
import { HomeSceneComponent } from './scene/home-scene.component';

import { DeviceControlService } from './services/device-control.service';

import {
  DevicePanel,
  RoomItem,
  RoomLightConfig
} from './panels/shared/panel-models';
import { ROOMS } from './panels/shared/rooms.data';

@Component({
  selector: 'app-home3d',
  standalone: true,
  imports: [CommonModule, DevicePanelHostComponent, HomeSceneComponent],
  templateUrl: './home3d.html',
  styleUrl: './home3d.css'
})
export class Home3d {
  rooms: RoomItem[] = ROOMS;
  currentRoomId = 'gaming';

  selectedObject: THREE.Object3D | null = null;

  panel: DevicePanel = {
    name: 'No selection',
    type: 'unknown',
    status: 'Click a device'
  };

  get currentRoomFile(): string {
    return this.rooms.find(r => r.id === this.currentRoomId)?.file ?? '';
  }

  get currentRoomName(): string {
    return this.rooms.find(r => r.id === this.currentRoomId)?.name ?? 'Room';
  }

  get currentRoomLight(): RoomLightConfig {
    return this.rooms.find(r => r.id === this.currentRoomId)?.light ?? {
      ambientOff: 0.05,
      ambientOn: 0.9,
      directionalOff: 0.05,
      directionalOn: 1.2,
      color: '#ffe8b6'
    };
  }

  constructor(
    private deviceControl: DeviceControlService,
    private cdr: ChangeDetectorRef
  ) {}

  selectRoom(room: RoomItem): void {
    if (room.id === this.currentRoomId) return;

    this.currentRoomId = room.id;
    this.clearSelection();
  }

  onRoomLoaded(): void {
    this.panel = {
      name: this.currentRoomName,
      type: 'room',
      status: 'Active'
    };

    this.cdr.detectChanges();
  }

  onDeviceSelected(device: THREE.Object3D): void {
    const type = device.userData['type'] ?? 'unknown';

    this.selectedObject = device;

    if (type === 'lamp') {
      const isOn = this.deviceControl.toggleLamp(device);

      this.panel = {
        name: device.name || 'Device',
        type,
        status: isOn ? 'ON' : 'OFF'
      };
    } else {
      this.panel = {
        name: device.name || 'Device',
        type,
        status: device.userData['isOn'] ? 'ON' : 'OFF'
      };
    }

    this.cdr.detectChanges();
  }

  onSelectionCleared(): void {
    this.clearSelection();
  }

  private clearSelection(): void {
    this.selectedObject = null;

    this.panel = {
      name: 'No selection',
      type: 'unknown',
      status: 'Click a device'
    };

    this.cdr.detectChanges();
  }

  changeFridgeTemp(delta: number): void {
    this.deviceControl.changeFridgeTemp(this.selectedObject, delta);
    this.cdr.detectChanges();
  }

  changeStoveTemp(delta: number): void {
    this.deviceControl.changeStoveTemp(this.selectedObject, delta);
    this.cdr.detectChanges();
  }
  toggleLamp(): void {
    const isOn = this.deviceControl.toggleLamp(this.selectedObject);
    this.panel.status = isOn ? 'ON' : 'OFF';
    this.cdr.detectChanges();
  }
  setLampColor(color: string): void {
    this.deviceControl.setLampColor(this.selectedObject, color);
    this.cdr.detectChanges();
  }
}
