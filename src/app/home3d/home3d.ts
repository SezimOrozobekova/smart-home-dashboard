import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type DeviceType =
  | 'room'
  | 'lamp'
  | 'fridge'
  | 'stove'
  | 'kettle'
  | 'computer'
  | 'unknown';

type DevicePanel = {
  name: string;
  type: DeviceType;
  status: string;
};

@Component({
  selector: 'app-home3d',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home3d.html',
  styleUrl: './home3d.css'
})
export class Home3d implements AfterViewInit, OnDestroy {
  @ViewChild('canvasHost', { static: true })
  canvasHost!: ElementRef<HTMLDivElement>;

  /* ================= UI ================= */

  panel: DevicePanel = {
    name: 'No selection',
    type: 'unknown',
    status: 'Click a device'
  };

  rooms = [
    { id: 'gaming', name: 'Gaming Room', file: 'gaming_room.glb' },
    { id: 'bathroom', name: 'Bathroom', file: 'bathroom.glb' },
    { id: 'kitchen', name: 'Kitchen', file: 'kitchen.glb' }
  ];

  currentRoomId = 'gaming';
  selectedObject: THREE.Object3D | null = null;

  /* ================= THREE ================= */

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: any;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private currentRoom: THREE.Object3D | null = null;
  private rafId: number | null = null;
  private resizeObs!: ResizeObserver;

  constructor(private zone: NgZone) {}

  /* ================= LIFECYCLE ================= */

  async ngAfterViewInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    const { OrbitControls } = await import(
      'three/examples/jsm/controls/OrbitControls.js'
    );

    this.zone.runOutsideAngular(() => {
      this.initScene(OrbitControls);
      this.attachEvents();
      this.observeResize();
      this.loadRoom('gaming_room.glb', 'Gaming Room');
      this.start();
    });
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.controls?.dispose();
    this.renderer?.dispose();
    this.resizeObs?.disconnect();
  }

  /* ================= SCENE ================= */

  private initScene(OrbitControls: any): void {
    const host = this.canvasHost.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0f172a');

    this.camera = new THREE.PerspectiveCamera(
      55,
      host.clientWidth / host.clientHeight,
      0.1,
      500
    );
    this.camera.position.set(6, 4, 8);
    this.camera.lookAt(0, 1.5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(6, 10, 8);
    this.scene.add(sun);
  }

  /* ================= ROOMS & DEVICES ================= */

  selectRoom(room: any): void {
    if (room.id === this.currentRoomId) return;

    this.clearSelection();
    this.currentRoomId = room.id;
    this.loadRoom(room.file, room.name);
  }

  private loadRoom(file: string, roomName: string): void {
    const loader = new GLTFLoader();

    if (this.currentRoom) {
      this.scene.remove(this.currentRoom);
    }

    loader.load(`assets/models/${file}`, gltf => {
      const room = gltf.scene;

      room.traverse((obj: any) => {
        if (!obj.isMesh) return;

        const root = obj.parent;
        if (!root) return;

        const name = (root.name || '').toLowerCase();

        if (name.includes('fridge')) {
          root.userData = {
            device: true,
            type: 'fridge',
            isOn: true,
            temperature: 4,
            minTemp: -18,
            maxTemp: 8
          };
        }

        else if (name.includes('stove') || name.includes('oven')) {
          root.userData = {
            device: true,
            type: 'stove',
            isOn: true,
            temperature: 180
          };
        }

        else if (name.includes('coffee')) {
          root.userData = {
            device: true,
            type: 'kettle',
            isOn: false,
            timeLeft: 120
          };
        }
      });

      this.scene.add(room);
      this.currentRoom = room;

      this.zone.run(() => {
        this.panel = {
          name: roomName,
          type: 'room',
          status: 'Active'
        };
      });
    });
  }

  /* ================= INTERACTION ================= */

  private attachEvents(): void {
    this.renderer.domElement.addEventListener(
      'pointerdown',
      this.onPointerDown,
      { passive: true }
    );
  }

  private onPointerDown = (ev: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);

    // 🔥 ВСЕГДА ГАСИМ ВСЁ
    this.clearAllHighlights();

    if (hits.length === 0) {
      this.zone.run(() => this.clearSelection());
      return;
    }

    const device = this.findDeviceRoot(hits[0].object);
    if (!device) {
      this.zone.run(() => this.clearSelection());
      return;
    }

    // 🔥 подсвечиваем ТОЛЬКО выбранный
    this.highlightObject(device);

    this.zone.run(() => {
      this.selectedObject = device;
      this.panel = {
        name: device.name,
        type: device.userData['type'] ?? 'unknown',
        status: device.userData['isOn'] ? 'ON' : 'OFF'
      };
    });
  };

  private clearSelection(): void {
    this.clearAllHighlights();
    this.selectedObject = null;

    this.panel = {
      name: 'No selection',
      type: 'unknown',
      status: 'Click a device'
    };
  }

  /* ================= HIGHLIGHT ================= */

  private highlightObject(obj: THREE.Object3D): void {
    obj.traverse(child => {
      if (!(child as any).isMesh) return;

      const mesh = child as THREE.Mesh;

      // 🔥 КЛОНИРУЕМ МАТЕРИАЛ ОДИН РАЗ
      if (!mesh.userData['_origMaterial']) {
        mesh.userData['_origMaterial'] = mesh.material;
        mesh.material = (mesh.material as THREE.Material).clone();
      }

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive = new THREE.Color('#38bdf8');
      mat.emissiveIntensity = 0.6;
    });
  }

  private clearAllHighlights(): void {
    this.scene.traverse(obj => {
      if (!(obj as any).isMesh) return;

      const mesh = obj as THREE.Mesh;

      if (mesh.userData['_origMaterial']) {
        mesh.material = mesh.userData['_origMaterial'];
        delete mesh.userData['_origMaterial'];
      }
    });
  }


  /* ================= HELPERS ================= */

  private findDeviceRoot(obj: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = obj;

    while (current) {
      if (current.userData?.['device']) return current;
      current = current.parent;
    }
    return null;
  }

  /* ================= PANEL COMPUTED ================= */

  get isFridgeSelected(): boolean {
    return this.selectedObject?.userData?.['type'] === 'fridge';
  }

  get isStoveSelected(): boolean {
    return this.selectedObject?.userData?.['type'] === 'stove';
  }

  get isKettleSelected(): boolean {
    return this.selectedObject?.userData?.['type'] === 'kettle';
  }

  get fridgeTemperature(): number {
    return this.selectedObject!.userData['temperature'];
  }

  get stoveTemperature(): number {
    return this.selectedObject!.userData['temperature'];
  }

  get kettleTimeLeft(): number {
    return this.selectedObject!.userData['timeLeft'];
  }

  /* ================= DEVICE ACTIONS ================= */

  changeFridgeTemp(delta: number): void {
    const d = this.selectedObject!.userData;
    d['temperature'] = THREE.MathUtils.clamp(
      d['temperature'] + delta,
      d['minTemp'],
      d['maxTemp']
    );
  }

  changeStoveTemp(delta: number): void {
    const d = this.selectedObject!.userData;
    d['temperature'] = THREE.MathUtils.clamp(
      d['temperature'] + delta,
      50,
      300
    );
  }

  /* ================= LOOP ================= */

  private start(): void {
    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  private observeResize(): void {
    const host = this.canvasHost.nativeElement;

    this.resizeObs = new ResizeObserver(() => {
      this.camera.aspect = host.clientWidth / host.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(host.clientWidth, host.clientHeight);
    });

    this.resizeObs.observe(host);
  }
}
