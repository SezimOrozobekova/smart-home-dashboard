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

export interface RoomLayoutResponse {
  roomId: string;
  roomName: string;
  roomWidth: number;
  roomDepth: number;
  items: RoomLayoutItem[];
}
