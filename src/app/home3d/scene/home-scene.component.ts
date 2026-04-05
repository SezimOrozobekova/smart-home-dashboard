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

import { RoomLoaderService } from '../services/room-loader.service';
import { SceneSelectionService } from '../services/scene-selection.service';
import { RoomLightConfig } from '../panels/shared/panel-models';

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

  @Input() roomFile = '';
  @Input() roomLight!: RoomLightConfig;

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
  private rafId: number | null = null;
  private resizeObs!: ResizeObserver;
  private isReady = false;

  constructor(
    private zone: NgZone,
    private roomLoader: RoomLoaderService,
    private sceneSelection: SceneSelectionService
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

      if (this.roomFile) {
        this.loadRoom(this.roomFile);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isReady) return;

    if (changes['roomLight']) {
      this.applyRoomLight();
    }

    if (changes['roomFile'] && this.roomFile) {
      this.clearSelection();
      this.loadRoom(this.roomFile);
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

    // без теней
    this.renderer.shadowMap.enabled = false;

    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.05);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 0.05);
    sun.position.set(6, 10, 8);
    this.scene.add(sun);

    this.scene.userData['ambientLight'] = ambient;
    this.scene.userData['sunLight'] = sun;

    this.applyRoomLight();
  }

  private applyRoomLight(): void {
    if (!this.scene || !this.roomLight) return;

    const ambient = this.scene.userData['ambientLight'] as THREE.AmbientLight | undefined;
    const sun = this.scene.userData['sunLight'] as THREE.DirectionalLight | undefined;

    if (!ambient || !sun) return;

    ambient.color.set(this.roomLight.color);
    ambient.intensity = this.roomLight.ambientOff;

    sun.color.set(this.roomLight.color);
    sun.intensity = this.roomLight.directionalOff;

    this.scene.userData['ambientOff'] = this.roomLight.ambientOff;
    this.scene.userData['ambientOn'] = this.roomLight.ambientOn;
    this.scene.userData['sunOff'] = this.roomLight.directionalOff;
    this.scene.userData['sunOn'] = this.roomLight.directionalOn;
    this.scene.userData['roomLightColor'] = this.roomLight.color;
  }

  private roomInstances = new Map<string, THREE.Object3D>();

  private async loadRoom(file: string): Promise<void> {
    try {
      this.sceneSelection.clearAllHighlights(this.scene);

      if (this.currentRoom) {
        this.currentRoom.visible = false;
      }

      const existing = this.roomInstances.get(file);
      if (existing) {
        existing.visible = true;
        this.currentRoom = existing;
        this.roomLoaded.emit();
        return;
      }

      const room = await this.roomLoader.loadRoom(file);
      room.visible = true;

      this.scene.add(room);
      this.roomInstances.set(file, room);
      this.currentRoom = room;

      this.roomLoaded.emit();
    } catch (error) {
      console.error('Failed to load room:', error);
    }
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
    const hits = this.currentRoom
      ? this.raycaster.intersectObjects([this.currentRoom], true)
      : [];
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
