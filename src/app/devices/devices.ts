import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Device = {
  name: string;
  icon: string;
  power: number;
  active: boolean;
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
      { name: 'Washing Machine', icon: '🧺', power: 420, active: false },
      { name: 'Water Heater', icon: '🚿', power: 850, active: true }
    ],
    Kitchen: [
      { name: 'Fridge', icon: '🧊', power: 180, active: true },
      { name: 'Electric Kettle', icon: '☕', power: 2000, active: false },
      { name: 'Stove', icon: '🍳', power: 1500, active: false }
    ],
    LivingRoom: [
      { name: 'TV', icon: '📺', power: 120, active: true },
      { name: 'Computer', icon: '🖥️', power: 450, active: true },
      { name: 'Main Light', icon: '💡', power: 18, active: false }
    ]
  };

  toggleDevice(device: Device): void {
    device.active = !device.active;
    device.power = device.active ? device.power : 0;
  }
}
