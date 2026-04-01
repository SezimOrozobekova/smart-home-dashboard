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
    d['isOn'] = !d['isOn'];

    const light = d['light'] as THREE.PointLight;
    if (light) {
      light.intensity = d['isOn'] ? 1.2 : 0;
    }

    device.traverse(child => {
      if (!(child as any).isMesh) return;
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = d['isOn'] ? 0.6 : 0;
    });

    return d['isOn'];
  }

  setLampColor(device: THREE.Object3D | null, hex: string): void {
    if (!device) return;

    const light = device.userData['light'] as THREE.PointLight;
    if (light) {
      light.color.set(hex);
    }

    device.traverse(child => {
      if (!(child as any).isMesh) return;
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissive.set(hex);
    });
  }
}
