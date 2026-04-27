import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

import { SceneSelectionService } from '../services/scene-selection.service';
import { DeviceModelLoaderService } from '../services/device-model-loader.service';
import { RoomLayoutItem, RoomLayoutResponse } from '../models/room-layout.models';

@Component({
  selector: 'app-home-scene',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-scene.component.html',
  styleUrl: './home-scene.component.css'
})
export class HomeSceneComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasHost', { static: true })
  canvasHost!: ElementRef<HTMLDivElement>;

  @Input() roomLayout: RoomLayoutResponse | null = null;

  @Output() deviceSelected = new EventEmitter<THREE.Object3D>();
  @Output() selectionCleared = new EventEmitter<void>();
  @Output() roomLoaded = new EventEmitter<void>();

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: any;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private currentRoom: THREE.Object3D | null = null;
  private deviceObjects: THREE.Object3D[] = [];

  private rafId: number | null = null;
  private resizeObs!: ResizeObserver;
  private isReady = false;

  private layoutRenderVersion = 0;

  constructor(
    private zone: NgZone,
    private sceneSelection: SceneSelectionService,
    private modelLoader: DeviceModelLoaderService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    const { OrbitControls } = await import(
      'three/examples/jsm/controls/OrbitControls.js'
      );

    this.zone.runOutsideAngular(() => {
      this.initScene(OrbitControls);
      this.attachEvents();
      this.observeResize();
      this.start();
      this.isReady = true;

      if (this.roomLayout) {
        void this.loadRoomFromLayout();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isReady) return;

    if (changes['roomLayout'] && this.roomLayout) {
      void this.loadRoomFromLayout();
    }
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.controls?.dispose();
    this.renderer?.dispose();
    this.resizeObs?.disconnect();

    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    }
  }

  private initScene(OrbitControls: any): void {
    const host = this.canvasHost.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1020');

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1.2, 0);

    this.createLights();
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 1.6);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(5, 8, 6);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.scene.add(directional);

    this.scene.userData['ambientLight'] = ambient;
    this.scene.userData['sunLight'] = directional;
  }



  private async loadRoomFromLayout(): Promise<void> {
    if (!this.roomLayout) {
      return;
    }

    const renderVersion = ++this.layoutRenderVersion;

    this.sceneSelection.clearAllHighlights(this.scene);
    this.clearSelection();
    this.clearDeviceObjects();
    this.buildRoomShell(this.roomLayout.roomWidth, this.roomLayout.roomDepth);

    for (const item of this.roomLayout.items) {
      try {
        const object = await this.createDeviceObject(item);

        if (renderVersion !== this.layoutRenderVersion) {
          return;
        }

        this.scene.add(object);
        this.deviceObjects.push(object);
      } catch (error) {
        console.error('Failed to load device model:', item, error);
      }
    }

    if (renderVersion === this.layoutRenderVersion) {
      this.roomLoaded.emit();
    }
  }

  private buildRoomShell(width: number, depth: number): void {
    if (this.currentRoom) {
      this.scene.remove(this.currentRoom);
      this.currentRoom = null;
    }

    const roomGroup = new THREE.Group();
    roomGroup.name = 'room-shell';

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshStandardMaterial({ color: '#8b7355' })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    roomGroup.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: '#dbe3ea',
      side: THREE.DoubleSide
    });
    const wallHeight = 4;

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(width, wallHeight),
      wallMaterial
    );
    backWall.position.set(0, wallHeight / 2, -depth / 2);
    roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(depth, wallHeight),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-width / 2, wallHeight / 2, 0);
    roomGroup.add(leftWall);

    const grid = new THREE.GridHelper(
      Math.max(width, depth),
      Math.max(Math.round(Math.max(width, depth)), 1)
    );
    roomGroup.add(grid);

    this.scene.add(roomGroup);
    this.currentRoom = roomGroup;
  }

  private async createDeviceObject(item: RoomLayoutItem): Promise<THREE.Object3D> {
    const typeCode = item.deviceTypeCode.toLowerCase();
    const object = await this.modelLoader.loadDeviceModel(item.deviceTypeCode);

    object.name = item.name;
    object.userData['device'] = true;
    object.userData['deviceId'] = item.deviceId;
    object.userData['deviceTypeId'] = item.deviceTypeId;
    object.userData['type'] = typeCode;

    object.position.set(item.positionX, item.positionY, item.positionZ);
    object.rotation.set(item.rotationX, item.rotationY, item.rotationZ);
    object.scale.set(item.scaleX, item.scaleY, item.scaleZ);

    if (typeCode === 'lamp') {
      const light = new THREE.SpotLight(
        item.isActive ? '#ffe8b6' : '#ffffff',
        item.isActive ? 18 : 0,
        8,
        Math.PI / 5,
        0.35,
        1
      );

      light.position.set(0, 1.4, 0);
      light.target.position.set(0, 0, 0);

      object.add(light);
      object.add(light.target);

      object.userData['isOn'] = item.isActive;
      object.userData['light'] = light;
      object.userData['defaultIntensity'] = 18;
    }

    if (typeCode === 'fridge') {
      object.userData['temperature'] = 4;
      object.userData['minTemp'] = -5;
      object.userData['maxTemp'] = 10;
    }

    if (typeCode === 'stove') {
      object.userData['temperature'] = 120;
    }

    if (typeCode === 'kettle') {
      object.userData['timeLeft'] = 120;
    }

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return object;
  }

  private clearDeviceObjects(): void {
    for (const obj of this.deviceObjects) {
      this.scene.remove(obj);
    }

    this.deviceObjects = [];
  }

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

    const hits = this.raycaster.intersectObjects(this.deviceObjects, true);

    this.sceneSelection.clearAllHighlights(this.scene);

    if (hits.length === 0) {
      this.clearSelection();
      return;
    }

    const device = this.sceneSelection.findDeviceRoot(hits[0].object);

    if (!device) {
      this.clearSelection();
      return;
    }

    this.sceneSelection.highlightObject(device);
    this.deviceSelected.emit(device);
  };

  private clearSelection(): void {
    if (!this.scene) return;

    this.sceneSelection.clearAllHighlights(this.scene);
    this.selectionCleared.emit();
  }

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
