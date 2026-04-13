import { ChangeDetectorRef, Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

import { DevicePanelHostComponent } from './panels/device-panel-host.component';
import { HomeSceneComponent } from './scene/home-scene.component';
import { DeviceControlService } from './services/device-control.service';
import { Home3dLayoutStore } from './services/home3d-layout.store';

import {
  DevicePanel,
  RoomLightConfig
} from './panels/shared/panel-models';

@Component({
  selector: 'app-home3d',
  standalone: true,
  imports: [CommonModule, DevicePanelHostComponent, HomeSceneComponent],
  templateUrl: './home3d.html',
  styleUrl: './home3d.css'
})
export class Home3d implements OnInit {
  selectedObject: THREE.Object3D | null = null;

  panel: DevicePanel = {
    name: 'No selection',
    type: 'unknown',
    status: 'Click a device'
  };

  readonly rooms = computed(() => this.layoutStore.rooms());
  readonly currentRoom = computed(() => this.layoutStore.currentRoom());
  readonly isLoadingRooms = computed(() => this.layoutStore.isLoading());
  readonly errorMessage = computed(() => this.layoutStore.error());

  get currentRoomName(): string {
    return this.currentRoom()?.roomName ?? 'Room';
  }

  get currentRoomLight(): RoomLightConfig {
    return {
      ambientOff: 0.05,
      ambientOn: 0.9,
      directionalOff: 0.05,
      directionalOn: 1.2,
      color: '#ffe8b6'
    };
  }

  constructor(
    private layoutStore: Home3dLayoutStore,
    private deviceControl: DeviceControlService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.layoutStore.loadLayouts();
  }

  selectRoom(roomId: string): void {
    if (roomId === this.layoutStore.currentRoomId()) return;

    this.layoutStore.selectRoom(roomId);
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
