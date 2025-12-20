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
import { Header } from '../header/header';

type DevicePanel = {
  name: string;
  type: string;
  status?: string;
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

  panel: DevicePanel | null = {
    name: 'No room selected',
    type: 'info',
    status: 'Click a room'
  };

  kpis = {
    totalW: 860,
    todayKwh: 6.4,
    ecoScore: 82,
    alerts: 1
  };

  rooms = [
    { id: 'gaming', name: 'Gaming Room', file: 'gaming_room.glb' },
    { id: 'bathroom', name: 'Bathroom', file: 'bathroom.glb' },
    { id: 'kitchen', name: 'Kitchen', file: 'kitchen.glb' }
  ];

  currentRoomId = 'gaming';
  private currentRoom: THREE.Object3D | null = null;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: any;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private rafId: number | null = null;
  private resizeObs!: ResizeObserver;

  constructor(private zone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    const controlsMod: any = await import(
      'three/examples/jsm/controls/OrbitControls.js'
    );
    const OrbitControls = controlsMod.OrbitControls;

    setTimeout(() => {
      this.zone.runOutsideAngular(() => {
        this.initScene(OrbitControls);
        this.start();
        this.attachEvents();
        this.observeResize();
        this.loadRoom('gaming_room.glb', 'Gaming Room');
      });
    });
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.renderer?.dispose();
    this.controls?.dispose();
    this.resizeObs?.disconnect();
  }

  /* ================= SCENE ================= */

  private initScene(OrbitControls: any): void {
    const host = this.canvasHost.nativeElement;
    host.innerHTML = '';

    const w = host.clientWidth;
    const h = host.clientHeight;

    if (w === 0 || h === 0) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0f172a');

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    this.camera.position.set(6, 4, 8);
    this.camera.lookAt(0, 1.5, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // LIGHT
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(6, 10, 8);
    this.scene.add(sun);

    // FLOOR
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x020617 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
  }

  /* ================= ROOMS ================= */

  selectRoom(room: any): void {
    if (room.id === this.currentRoomId) return;
    this.currentRoomId = room.id;
    this.loadRoom(room.file, room.name);
  }

  private loadRoom(file: string, name: string): void {
    const loader = new GLTFLoader();

    if (this.currentRoom) {
      this.scene.remove(this.currentRoom);
      this.currentRoom = null;
    }

    loader.load(
      `assets/models/${file}`,
      (gltf) => {
        const room = gltf.scene;

        const box = new THREE.Box3().setFromObject(room);
        const center = box.getCenter(new THREE.Vector3());
        room.position.sub(center);

        if (this.currentRoomId === 'kitchen') {
          room.position.x += 1.5;
          room.position.z += 0.5;
        }

        if (this.currentRoomId === 'bathroom') {
          room.position.x += 8;
          room.position.z += 1;
        }

        room.scale.set(1.5, 1.5, 1.5);

        const boxAfter = new THREE.Box3().setFromObject(room);
        room.position.y -= boxAfter.min.y;

        room.name = name;
        room.userData['device'] = true;
        room.userData['type'] = 'room';

        this.scene.add(room);
        this.currentRoom = room;

        this.zone.run(() => {
          this.panel = {
            name,
            type: 'room',
            status: 'Active'
          };
        });
      }
    );
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
    const hit = hits.find((h) => h.object.userData?.['device']);

    if (!hit) return;

    this.zone.run(() => {
      this.panel = {
        name: hit.object.name,
        type: 'room',
        status: 'Selected'
      };
    });
  };

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
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    this.resizeObs.observe(host);
  }
}
