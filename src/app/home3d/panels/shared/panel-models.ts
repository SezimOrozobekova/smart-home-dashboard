import * as THREE from 'three';

export type DeviceType =
  | 'room'
  | 'lamp'
  | 'fridge'
  | 'stove'
  | 'kettle'
  | 'unknown';

export type DevicePanel = {
  name: string;
  type: DeviceType;
  status: string;
};

export type SelectedDevice = THREE.Object3D | null;

export interface RoomLightConfig {
  ambientOff: number;
  ambientOn: number;
  directionalOff: number;
  directionalOn: number;
  color: string;
}

export interface RoomItem {
  id: string;
  name: string;
  file: string;
  light?: RoomLightConfig;
}
