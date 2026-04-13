import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class DeviceControlService {
  changeFridgeTemp(device: THREE.Object3D | null, delta: number): void {
    if (!device) return;

    const d = device.userData;
    d['temperature'] = THREE.MathUtils.clamp(
      d['temperature'] + delta,
      d['minTemp'],
      d['maxTemp']
    );
  }

  changeStoveTemp(device: THREE.Object3D | null, delta: number): void {
    if (!device) return;

    const d = device.userData;
    d['temperature'] = THREE.MathUtils.clamp(
      d['temperature'] + delta,
      50,
      300
    );
  }

  toggleLamp(device: THREE.Object3D | null): boolean {
    if (!device) return false;

    const d = device.userData;
    const light = d['light'] as THREE.SpotLight | null;

    d['isOn'] = !d['isOn'];

    if (light) {
      light.intensity = d['isOn'] ? (d['defaultIntensity'] ?? 18) : 0;
    }

    return d['isOn'];
  }

  setLampColor(device: THREE.Object3D | null, hex: string): void {
    if (!device) return;

    const light = device.userData['light'] as THREE.SpotLight | null;

    if (light) {
      light.color.set(hex);
    }

    device.userData['lampColor'] = hex;
  }

  setLampIntensity(device: THREE.Object3D | null, intensity: number): void {
    if (!device) return;

    const d = device.userData;
    const light = d['light'] as THREE.SpotLight | null;

    d['defaultIntensity'] = intensity;

    if (light && d['isOn']) {
      light.intensity = intensity;
    }
  }
}
