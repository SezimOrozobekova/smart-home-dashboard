import { ElementRef, Injectable, NgZone } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { EditorModelItem, RoomLayoutItem } from './room-editor-models';

@Injectable({
  providedIn: 'root'
})
export class RoomEditorSceneService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private orbitControls!: OrbitControls;
  private transformControls!: TransformControls;
  private host!: HTMLElement;

  private loader = new GLTFLoader();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private placedObjects: THREE.Object3D[] = [];
  private selectedObject: THREE.Object3D | null = null;
  private rafId: number | null = null;
  private resizeObserver!: ResizeObserver;

  private roomObjects: THREE.Object3D[] = [];
  private roomWidth = 8;
  private roomDepth = 8;
  private roomHeight = 4;

  private lastValidPosition = new THREE.Vector3();

  constructor(private zone: NgZone) {}

  init(hostRef: ElementRef<HTMLDivElement>): void {
    if (typeof window === 'undefined') return;

    this.host = hostRef.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#111827');

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.host.clientWidth / this.host.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(6, 5, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight);
    this.renderer.shadowMap.enabled = true;

    this.host.appendChild(this.renderer.domElement);

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.target.set(0, 1, 0);

    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);

    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.orbitControls.enabled = !event.value;
    });

    this.transformControls.addEventListener('mouseDown', () => {
      if (this.selectedObject) {
        this.lastValidPosition.copy(this.selectedObject.position);
      }
    });

    this.transformControls.addEventListener('objectChange', () => {
      if (!this.selectedObject) return;

      if (
        !this.isInsideRoom(this.selectedObject) ||
        this.intersectsWithOtherObjects(this.selectedObject)
      ) {
        this.selectedObject.position.copy(this.lastValidPosition);
      } else {
        this.lastValidPosition.copy(this.selectedObject.position);
      }
    });

    this.scene.add(this.transformControls.getHelper());

    this.createLights();
    this.createRoom();
    this.attachEvents();
    this.observeResize();

    this.zone.runOutsideAngular(() => this.animate());
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(5, 8, 6);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.scene.add(directional);
  }

  private createRoom(): void {
    this.clearRoom();

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roomWidth, this.roomDepth),
      new THREE.MeshStandardMaterial({ color: '#8b7355' })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    this.scene.add(floor);
    this.roomObjects.push(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: '#e5e7eb' });

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roomWidth, this.roomHeight),
      wallMaterial
    );
    backWall.position.set(0, this.roomHeight / 2, -this.roomDepth / 2);
    this.scene.add(backWall);
    this.roomObjects.push(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roomDepth, this.roomHeight),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-this.roomWidth / 2, this.roomHeight / 2, 0);
    this.scene.add(leftWall);
    this.roomObjects.push(leftWall);

    const gridSize = Math.max(this.roomWidth, this.roomDepth);
    const gridDivisions = Math.max(Math.round(gridSize), 1);

    const grid = new THREE.GridHelper(gridSize, gridDivisions);
    this.scene.add(grid);
    this.roomObjects.push(grid);
  }

  updateRoomSize(width: number, depth: number): void {
    this.roomWidth = width;
    this.roomDepth = depth;
    this.createRoom();

    if (this.selectedObject) {
      if (
        !this.isInsideRoom(this.selectedObject) ||
        this.intersectsWithOtherObjects(this.selectedObject)
      ) {
        this.transformControls.detach();
        this.selectedObject = null;
      }
    }
  }

  private clearRoom(): void {
    for (const object of this.roomObjects) {
      this.scene.remove(object);
    }

    this.roomObjects = [];
  }

  addModel(modelItem: EditorModelItem): void {
    this.loader.load(
      modelItem.path,
      (gltf) => {
        const model = gltf.scene;

        this.prepareModelShadows(model);

        if (modelItem.scale) {
          model.scale.setScalar(modelItem.scale);
        }

        const initialBox = new THREE.Box3().setFromObject(model);
        const minY = initialBox.min.y;

        model.userData['deviceId'] = null;
        model.userData['deviceTypeId'] = modelItem.id;
        model.userData['deviceName'] = modelItem.name;
        model.userData['isPlacedObject'] = true;

        const freePosition = this.findFreePosition(model, minY);

        if (!freePosition) {
          console.warn('No free space available for new object');
          return;
        }

        model.position.copy(freePosition);

        this.scene.add(model);
        this.placedObjects.push(model);
        this.selectObject(model);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }

  loadLayoutItems(items: RoomLayoutItem[]): void {
    this.clearPlacedObjects();

    for (const item of items) {
      const modelPath = `/assets/models/${item.deviceTypeCode.toLowerCase()}.glb`;

      this.loader.load(
        modelPath,
        (gltf) => {
          const model = gltf.scene;

          this.prepareModelShadows(model);

          model.userData['deviceId'] = item.deviceId;
          model.userData['deviceTypeId'] = item.deviceTypeId;
          model.userData['deviceName'] = item.name;
          model.userData['isPlacedObject'] = true;

          model.position.set(item.positionX, item.positionY, item.positionZ);
          model.rotation.set(item.rotationX, item.rotationY, item.rotationZ);
          model.scale.set(item.scaleX, item.scaleY, item.scaleZ);

          this.scene.add(model);
          this.placedObjects.push(model);
        },
        undefined,
        (error) => {
          console.error('Error loading saved layout model:', error);
        }
      );
    }
  }

  private clearPlacedObjects(): void {
    this.transformControls.detach();
    this.selectedObject = null;

    for (const object of this.placedObjects) {
      this.scene.remove(object);
    }

    this.placedObjects = [];
  }

  private prepareModelShadows(model: THREE.Object3D): void {
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }

  setMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.transformControls.setMode(mode);
  }

  removeSelected(): void {
    if (!this.selectedObject) return;

    this.transformControls.detach();
    this.scene.remove(this.selectedObject);
    this.placedObjects = this.placedObjects.filter((obj) => obj !== this.selectedObject);
    this.selectedObject = null;
  }

  private selectObject(object: THREE.Object3D | null): void {
    this.selectedObject = object;

    if (object) {
      this.lastValidPosition.copy(object.position);
      this.transformControls.attach(object);
    } else {
      this.transformControls.detach();
    }
  }

  private attachEvents(): void {
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
  }

  private onPointerDown = (event: PointerEvent): void => {
    const activeAxis = (this.transformControls as any).axis;

    if (activeAxis) {
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.placedObjects, true);

    if (!intersects.length) {
      this.selectObject(null);
      return;
    }

    let target: THREE.Object3D = intersects[0].object;

    while (target.parent && !target.userData['isPlacedObject']) {
      target = target.parent;
    }

    this.selectObject(target);
  };

  private observeResize(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.host) return;

      const width = this.host.clientWidth;
      const height = this.host.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    this.resizeObserver.observe(this.host);
  }

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private intersectsWithOtherObjects(target: THREE.Object3D): boolean {
    const targetBox = new THREE.Box3().setFromObject(target);

    for (const obj of this.placedObjects) {
      if (obj === target) continue;

      const objectBox = new THREE.Box3().setFromObject(obj);

      if (targetBox.intersectsBox(objectBox)) {
        return true;
      }
    }

    return false;
  }

  private isInsideRoom(target: THREE.Object3D): boolean {
    const box = new THREE.Box3().setFromObject(target);

    const halfWidth = this.roomWidth / 2;
    const halfDepth = this.roomDepth / 2;

    return (
      box.min.x >= -halfWidth &&
      box.max.x <= halfWidth &&
      box.min.z >= -halfDepth &&
      box.max.z <= halfDepth
    );
  }

  private findFreePosition(model: THREE.Object3D, minY: number): THREE.Vector3 | null {
    const step = 1.5;
    const maxRadius = 10;

    for (let radius = 0; radius <= maxRadius; radius++) {
      for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
          const posX = x * step;
          const posZ = z * step;

          model.position.set(posX, -minY, posZ);

          if (!this.isInsideRoom(model)) continue;
          if (this.intersectsWithOtherObjects(model)) continue;

          return new THREE.Vector3(posX, -minY, posZ);
        }
      }
    }

    return null;
  }

  getLayoutSnapshot() {
    return {
      roomWidth: this.roomWidth,
      roomDepth: this.roomDepth,
      items: this.placedObjects.map((obj) => ({
        deviceId: obj.userData['deviceId'] ?? null,
        deviceTypeId: obj.userData['deviceTypeId'],
        name: obj.userData['deviceName'],

        positionX: obj.position.x,
        positionY: obj.position.y,
        positionZ: obj.position.z,

        rotationX: obj.rotation.x,
        rotationY: obj.rotation.y,
        rotationZ: obj.rotation.z,

        scaleX: obj.scale.x,
        scaleY: obj.scale.y,
        scaleZ: obj.scale.z
      }))
    };
  }

  destroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);

    this.resizeObserver?.disconnect();
    this.orbitControls?.dispose();
    this.transformControls?.dispose();

    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    }

    this.renderer?.dispose();
  }
}
