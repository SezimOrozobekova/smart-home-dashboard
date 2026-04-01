import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import {FridgePanelComponent} from './ fridge-panel/fridge-panel.component';
import {StovePanelComponent} from './stove-panel/ stove-panel.component';
import {KettlePanelComponent} from './ kettle-panel/kettle-panel.component';
import {LampPanelComponent} from './ lamp-panel/lamp-panel.component';


type DeviceType =
  | 'room'
  | 'lamp'
  | 'fridge'
  | 'stove'
  | 'kettle'
  | 'unknown';

type DevicePanel = {
  name: string;
  type: DeviceType;
  status: string;
};

@Component({
  selector: 'app-device-panel-host',
  standalone: true,
  imports: [
    CommonModule,
    FridgePanelComponent,
    StovePanelComponent,
    KettlePanelComponent,
    LampPanelComponent
  ],
  templateUrl: './device-panel-host.component.html',
  styleUrl: './device-panel-host.component.css'
})
export class DevicePanelHostComponent {
  @Input() panel!: DevicePanel;
  @Input() selectedObject: THREE.Object3D | null = null;

  @Output() fridgeTempChange = new EventEmitter<number>();
  @Output() stoveTempChange = new EventEmitter<number>();
  @Output() lampToggle = new EventEmitter<void>();
  @Output() lampColorChange = new EventEmitter<string>();

  onFridgeTempChange(delta: number) {
    this.fridgeTempChange.emit(delta);
  }

  onStoveTempChange(delta: number) {
    this.stoveTempChange.emit(delta);
  }

  onLampToggle() {
    this.lampToggle.emit();
  }

  onLampColorChange(color: string) {
    this.lampColorChange.emit(color);
  }

  get isFridgeSelected(): boolean {
    return this.selectedObject?.userData?.['type'] === 'fridge';
  }

  get isStoveSelected(): boolean {
    return this.selectedObject?.userData?.['type'] === 'stove';
  }

  get isKettleSelected(): boolean {
    return this.selectedObject?.userData?.['type'] === 'kettle';
  }

  get isLampSelected(): boolean {
    return this.selectedObject?.userData?.['type'] === 'lamp';
  }

  get fridgeTemperature(): number {
    return this.selectedObject?.userData?.['temperature'] ?? 0;
  }

  get stoveTemperature(): number {
    return this.selectedObject?.userData?.['temperature'] ?? 0;
  }

  get kettleTimeLeft(): number {
    return this.selectedObject?.userData?.['timeLeft'] ?? 0;
  }
}
