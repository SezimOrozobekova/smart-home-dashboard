import { Component } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';

type Device = {
  name: string;
  type: string;
  room: string;
  power: number;
  basePower: number;
  active: boolean;
  updatedAt: string;
};

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devices.html',
  styleUrl: './devices.css'
})
export class Devices {
  devicesByRoom: Record<string, Device[]> = {
    Bathroom: [
      {
        name: 'Washing Machine',
        type: 'Laundry',
        room: 'Bathroom',
        power: 420,
        basePower: 420,
        active: false,
        updatedAt: '2 min ago'
      },
      {
        name: 'Water Heater',
        type: 'Heating',
        room: 'Bathroom',
        power: 850,
        basePower: 850,
        active: true,
        updatedAt: 'Just now'
      }
    ],
    Kitchen: [
      {
        name: 'Fridge',
        type: 'Cooling',
        room: 'Kitchen',
        power: 180,
        basePower: 180,
        active: true,
        updatedAt: 'Just now'
      },
      {
        name: 'Electric Kettle',
        type: 'Heating',
        room: 'Kitchen',
        power: 0,
        basePower: 2000,
        active: false,
        updatedAt: '5 min ago'
      },
      {
        name: 'Stove',
        type: 'Cooking',
        room: 'Kitchen',
        power: 0,
        basePower: 1500,
        active: false,
        updatedAt: '12 min ago'
      }
    ],
    LivingRoom: [
      {
        name: 'TV',
        type: 'Entertainment',
        room: 'Living Room',
        power: 120,
        basePower: 120,
        active: true,
        updatedAt: 'Just now'
      },
      {
        name: 'Computer',
        type: 'Workstation',
        room: 'Living Room',
        power: 450,
        basePower: 450,
        active: true,
        updatedAt: '1 min ago'
      },
      {
        name: 'Main Light',
        type: 'Lighting',
        room: 'Living Room',
        power: 0,
        basePower: 18,
        active: false,
        updatedAt: '8 min ago'
      }
    ]
  };

  toggleDevice(device: Device): void {
    device.active = !device.active;
    device.power = device.active ? device.basePower : 0;
    device.updatedAt = 'Just now';
  }

  trackByRoom(index: number, room: KeyValue<string, Device[]>): string {
    return room.key;
  }

  trackByDevice(index: number, device: Device): string {
    return `${device.room}-${device.name}`;
  }

  getActiveCount(roomDevices: Device[]): number {
    return roomDevices.filter(device => device.active).length;
  }

  getTotalPower(roomDevices: Device[]): number {
    return roomDevices.reduce((sum, device) => sum + device.power, 0);
  }
}
