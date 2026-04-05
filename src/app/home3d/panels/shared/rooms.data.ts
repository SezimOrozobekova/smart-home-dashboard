import { RoomItem } from './panel-models';

export const ROOMS: RoomItem[] = [
  {
    id: 'gaming',
    name: 'Gaming Room',
    file: 'gaming_room.glb',
    light: {
      ambientOff: 0.04,
      ambientOn: 0.75,
      directionalOff: 0.03,
      directionalOn: 0.95,
      color: '#ffe8b6'
    }
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    file: 'kitchen.glb',
    light: {
      ambientOff: 0.05,
      ambientOn: 0.9,
      directionalOff: 0.05,
      directionalOn: 1.2,
      color: '#fff0d6'
    }
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    file: 'bathroom.glb',
    light: {
      ambientOff: 0.03,
      ambientOn: 0.8,
      directionalOff: 0.03,
      directionalOn: 1.0,
      color: '#f5f1ff'
    }
  },
  { id: 'myroom',
    name: 'Living room',
    file: 'living_room.glb',
    light: {
      ambientOff: 0.03,
      ambientOn: 0.8,
      directionalOff: 0.03,
      directionalOn: 1.0,
      color: '#f5f1ff'
    }
  }
];
