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

export type RoomItem = {
  id: string;
  name: string;
  file: string;
};

export type SelectedDevice = THREE.Object3D | null;
