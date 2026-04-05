import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class DeviceControlService {
  private findScene(obj: THREE.Object3D | null): THREE.Scene | null {
    let current: THREE.Object3D | null = obj;

    while (current) {
      if ((current as any).isScene) {
        return current as THREE.Scene;
      }
      current = current.parent;
    }

    return null;
  }

  private updateRoomLights(device: THREE.Object3D | null, isOn: boolean): void {
    const scene = this.findScene(device);
    if (!scene) return;

    const ambient = scene.userData['ambientLight'] as THREE.AmbientLight | undefined;
    const sun = scene.userData['sunLight'] as THREE.DirectionalLight | undefined;

    if (ambient) {
      ambient.intensity = isOn
        ? (scene.userData['ambientOn'] ?? 0.9)
        : (scene.userData['ambientOff'] ?? 0.05);
    }

    if (sun) {
      sun.intensity = isOn
        ? (scene.userData['sunOn'] ?? 1.2)
        : (scene.userData['sunOff'] ?? 0.05);
    }
  }

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

    this.updateRoomLights(device, d['isOn']);

    if (light) {
      light.intensity = d['isOn'] ? (d['defaultIntensity'] ?? 18) : 0;
    }

    return d['isOn'];
  }

  setLampColor(device: THREE.Object3D | null, hex: string): void {
    if (!device) return;

    const scene = this.findScene(device);
    const light = device.userData['light'] as THREE.SpotLight | null;

    if (light) {
      light.color.set(hex);
    }

    if (scene) {
      const ambient = scene.userData['ambientLight'] as THREE.AmbientLight | undefined;
      const sun = scene.userData['sunLight'] as THREE.DirectionalLight | undefined;

      if (ambient) {
        ambient.color.set(hex);
      }

      if (sun) {
        sun.color.set(hex);
      }

      scene.userData['roomLightColor'] = hex;
    }
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
