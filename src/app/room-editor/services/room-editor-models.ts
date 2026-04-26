export interface EditorModelItem {
  id: string;
  name: string;
  path: string;
  scale?: number;
}

export interface RoomLayoutItem {
  deviceId: string;
  deviceTypeId: string;
  deviceTypeCode: string;
  deviceTypeName: string;
  name: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  isActive: boolean;
}

export const ROOM_EDITOR_MODELS: EditorModelItem[] = [];
