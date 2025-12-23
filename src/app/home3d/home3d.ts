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
  | 'kettle'
  | 'stove'
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

  /* ================= KPI ================= */

  kpis = {
    totalW: 860,
    todayKwh: 6.4,
    ecoScore: 82
  };

  /* ================= UI STATE ================= */

  panel: DevicePanel = {
    name: 'No selection',
    type: 'unknown',
    status: 'Click an object'
  };

  rooms = [
    { id: 'gaming', name: 'Gaming Room', file: 'gaming_room.glb' },
    { id: 'bathroom', name: 'Bathroom', file: 'bathroom.glb' },
    { id: 'kitchen', name: 'Kitchen', file: 'kitchen.glb' }
  ];

  currentRoomId = 'gaming';

  /* ================= THREE ================= */

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: any;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private currentRoom: THREE.Object3D | null = null;
  private selectedObject: THREE.Mesh | null = null;

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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0f172a');

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    this.camera.position.set(6, 4, 8);
    this.camera.lookAt(0, 1.5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.scene.add(new THREE.AmbientLight(0xffffff, 1));

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(6, 10, 8);
    this.scene.add(sun);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x020617 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.userData['ignore'] = true;
    this.scene.add(floor);
  }

  /* ================= ROOMS ================= */

  selectRoom(room: any): void {
    if (room.id === this.currentRoomId) return;
    this.currentRoomId = room.id;
    this.loadRoom(room.file, room.name);
  }

  private loadRoom(file: string, roomName: string): void {
    const loader = new GLTFLoader();

    if (this.currentRoom) {
      this.scene.remove(this.currentRoom);
      this.currentRoom = null;
    }

    loader.load(`assets/models/${file}`, gltf => {
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

      room.traverse((obj: any) => {
        if (!obj.isMesh) return;

        const parent = obj.parent;
        if (!parent) return;

        const parentName = parent.name.toLowerCase();

        // 💡 LAMP
        if (parentName.includes('lamp')) {
          parent.userData['device'] = true;
          parent.userData['type'] = 'lamp';
          parent.userData['isOn'] = true;
          console.log('💡 LAMP REGISTERED:', parent.name);
        }

        // 🧊 FRIDGE
        else if (
          parentName.includes('fridge') ||
          parentName.includes('freezer')
        ) {
          parent.userData['device'] = true;
          parent.userData['type'] = 'fridge';
          parent.userData['isOn'] = true;
          console.log('🧊 FRIDGE REGISTERED:', parent.name);
        }

        // ☕ KETTLE / COFFEE
        else if (
          parentName.includes('coffee') ||
          parentName.includes('kettle')
        ) {
          parent.userData['device'] = true;
          parent.userData['type'] = 'kettle';
          parent.userData['isOn'] = false;
          console.log('☕ KETTLE REGISTERED:', parent.name);
        }

        // 🔥 STOVE
        else if (
          parentName.includes('stove') ||
          parentName.includes('cooktop') ||
          parentName.includes('oven')
        ) {
          parent.userData['device'] = true;
          parent.userData['type'] = 'stove';
          parent.userData['isOn'] = false;
          console.log('🔥 STOVE REGISTERED:', parent.name);
        }

        // 💻 COMPUTER
        else if (
          parentName.includes('computer') ||
          parentName.includes('pc') ||
          parentName.includes('monitor')
        ) {
          parent.userData['device'] = true;
          parent.userData['type'] = 'computer';
          parent.userData['isOn'] = true;
          console.log('💻 COMPUTER REGISTERED:', parent.name);
        }
      });


      room.userData['type'] = 'room';
      room.name = roomName;

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

    const hits = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );

    if (hits.length === 0) {
      console.log('❌ Nothing clicked');
      return;
    }

    const mesh = hits[0].object;

    console.log('🟢 CLICKED MESH');
    console.log('Name:', mesh.name);
    console.log('Parent:', mesh.parent?.name);

    const device = this.findDeviceRoot(mesh);

    if (!device) {
      console.log('⚠️ No device found in parents');
      return;
    }

    console.log('🟢 DEVICE FOUND');
    console.log('Name:', device.name);
    console.log('Type:', device.userData['type']);
    console.log('UserData:', device.userData);

    // сохраняем выбранное устройство
    this.selectedObject = device as THREE.Mesh;

    this.zone.run(() => {
      this.panel = {
        name: device.name,
        type: device.userData['type'] ?? 'unknown',
        status: device.userData['isOn'] ? 'ON' : 'OFF'
      };
    });
  };



  /* ================= DEVICE CONTROL ================= */

  toggleSelectedDevice(): void {
    if (!this.selectedObject) return;

    const data = this.selectedObject.userData;
    data['isOn'] = !data['isOn'];

    if (data['type'] === 'lamp') {
      const mat = this.selectedObject.material as THREE.MeshStandardMaterial;
      mat.color.set(data['isOn'] ? '#ffffff' : '#1e293b');
    }

    this.panel.status = data['isOn'] ? 'ON' : 'OFF';
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
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    this.resizeObs.observe(host);
  }


  private findDeviceRoot(obj: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = obj;

    while (current) {
      if (current.userData?.['device']) {
        return current;
      }
      current = current.parent;
    }

    return null;
  }

}
