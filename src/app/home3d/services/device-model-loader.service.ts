import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Injectable({
  providedIn: 'root'
})
export class DeviceModelLoaderService {
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, THREE.Object3D>();

  async loadDeviceModel(deviceTypeCode: string): Promise<THREE.Object3D> {
    const path = `assets/models/${deviceTypeCode.toLowerCase()}.glb`;

    const cached = this.cache.get(path);
    if (cached) {
      return cached.clone(true);
    }

    const scene = await this.loadGltfScene(path);
    this.prepareScene(scene);
    this.cache.set(path, scene);

    return scene.clone(true);
  }

  private loadGltfScene(path: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => reject(error)
      );
    });
  }

  private prepareScene(scene: THREE.Object3D): void {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }
}
