import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class SceneSelectionService {
  findDeviceRoot(obj: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = obj;

    while (current) {
      if (current.userData?.['device']) return current;
      current = current.parent;
    }

    return null;
  }

  highlightObject(obj: THREE.Object3D): void {

    obj.traverse(child => {
      if (!(child as any).isMesh) return;

      const mesh = child as THREE.Mesh;

      if (!mesh.userData['_origMaterial']) {
        mesh.userData['_origMaterial'] = mesh.material;
        mesh.material = (mesh.material as THREE.Material).clone();
      }

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive = new THREE.Color('#38bdf8');
      mat.emissiveIntensity = 0.6;
    });
  }

  clearAllHighlights(scene: THREE.Scene): void {
    scene.traverse(obj => {
      if (!(obj as any).isMesh) return;

      const mesh = obj as THREE.Mesh;

      if (mesh.userData['_origMaterial']) {
        mesh.material = mesh.userData['_origMaterial'];
        delete mesh.userData['_origMaterial'];
      }
    });
  }
}
