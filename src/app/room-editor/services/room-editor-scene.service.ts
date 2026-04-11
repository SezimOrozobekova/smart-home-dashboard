import { ElementRef, Injectable, NgZone } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { EditorModelItem } from './room-editor-models';

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
  private roomWidth = 12;
  private roomDepth = 12;
  private roomHeight = 4;

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

    this.scene.add(this.transformControls.getHelper());

    this.createLights();
    this.createRoom();
    this.attachEvents();
    this.observeResize();

    this.zone.runOutsideAngular(() => this.animate());
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
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

    const grid = new THREE.GridHelper(
      Math.max(this.roomWidth, this.roomDepth),
      Math.max(this.roomWidth, this.roomDepth)
    );
    this.scene.add(grid);
    this.roomObjects.push(grid);
  }

  updateRoomSize(width: number, depth: number): void {
    this.roomWidth = width;
    this.roomDepth = depth;
    this.createRoom();
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

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        if (modelItem.scale) {
          model.scale.setScalar(modelItem.scale);
        }

        const box = new THREE.Box3().setFromObject(model);
        const minY = box.min.y;

        model.position.set(0, -minY, 0);
        model.userData['modelId'] = modelItem.id;
        model.userData['isPlacedObject'] = true;

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

    // Если курсор сейчас на gizmo, не трогаем selection
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
