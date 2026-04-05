import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { setupDevice } from '../panels/shared/device-factory';

@Injectable({
  providedIn: 'root'
})
export class RoomLoaderService {
  private loader = new GLTFLoader();

  loadRoom(file: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        `assets/models/${file}`,
        gltf => {
          const room = gltf.scene;

          room.traverse(obj => {
            setupDevice(obj, room);

            if ((obj as any).isMesh) {
              const mesh = obj as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          resolve(room);
        },
        undefined,
        error => reject(error)
      );
    });
  }
}
