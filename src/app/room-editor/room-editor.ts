import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomEditorSceneService } from './services/room-editor-scene.service';
import { ROOM_EDITOR_MODELS, EditorModelItem } from './services/room-editor-models';
import { RoomEditorApiService } from './services/room-editor-api.service';

@Component({
  selector: 'app-room-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-editor.html',
  styleUrl: './room-editor.css'
})
export class RoomEditor implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sceneHost', { static: true })
  sceneHost!: ElementRef<HTMLDivElement>;

  models: EditorModelItem[] = ROOM_EDITOR_MODELS;
  isLoading = false;
  errorMessage = '';

  roomWidth = 12;
  roomDepth = 12;

  private roomId = '';

  isSidebarOpen = false;

  constructor(
    private sceneService: RoomEditorSceneService,
    private roomEditorApiService: RoomEditorApiService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';

    if (!this.roomId) {
      this.errorMessage = 'Room id is missing';
      return;
    }

    this.loadModels();
  }

  ngAfterViewInit(): void {
    this.sceneService.init(this.sceneHost);
    this.loadLayout();
  }

  private loadModels(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.roomEditorApiService
      .getEditorModels()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (models) => {
          this.models = models;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load editor models:', error);
          this.errorMessage = 'Failed to load models';
          this.cdr.detectChanges();
        }
      });
  }

  private loadLayout(): void {
    if (!this.roomId) {
      return;
    }

    this.roomEditorApiService.getLayout(this.roomId).subscribe({
      next: (layout) => {
        this.roomWidth = layout.roomWidth ?? 12;
        this.roomDepth = layout.roomDepth ?? 12;

        this.sceneService.updateRoomSize(this.roomWidth, this.roomDepth);
        this.sceneService.loadLayoutItems(layout.items ?? []);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load room layout:', error);
        this.errorMessage = 'Failed to load room layout';
        this.cdr.detectChanges();
      }
    });
  }

  addModel(model: EditorModelItem): void {
    this.sceneService.addModel(model);
  }

  setMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.sceneService.setMode(mode);
  }

  removeSelected(): void {
    this.sceneService.removeSelected();
  }

  applyRoomSize(): void {
    const width = Number(this.roomWidth);
    const depth = Number(this.roomDepth);

    if (Number.isNaN(width) || Number.isNaN(depth)) {
      return;
    }

    if (width < 4 || depth < 4) {
      return;
    }

    this.roomWidth = width;
    this.roomDepth = depth;

    this.sceneService.updateRoomSize(width, depth);
  }

  saveLayout(): void {
    const layout = this.sceneService.getLayoutSnapshot();

    this.roomEditorApiService
      .saveLayout(this.roomId, layout)
      .subscribe({
        next: () => {
          console.log('Layout saved');
          this.router.navigate(['/admin/rooms']);
        },
        error: (err) => {
          console.error('Failed to save layout', err);
          this.errorMessage = 'Failed to save layout';
          this.cdr.detectChanges();
        }
      });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  ngOnDestroy(): void {
    this.sceneService.destroy();
  }
}
