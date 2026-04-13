import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface RoomItem {
  id: string;
  name: string;
  homeId: string;
  createdAt: string;
  updatedAt: string;
}

interface HomeItem {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateRoomRequest {
  name: string;
  homeId: string;
}

@Component({
  selector: 'app-rooms-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rooms-page.html',
  styleUrl: './rooms-page.css'
})
export class RoomsPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  rooms: RoomItem[] = [];
  homes: HomeItem[] = [];

  isLoading = false;
  isCreating = false;
  isDeleting = false;
  errorMessage = '';

  isCreateModalOpen = false;
  newRoomName = '';
  selectedHomeId = '';

  isDeleteModalOpen = false;
  roomToDelete: RoomItem | null = null;

  ngOnInit(): void {
    this.loadRooms();
    this.loadHomes();
  }

  loadRooms(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<RoomItem[]>('/api/rooms/my').subscribe({
      next: (rooms) => {
        this.ngZone.run(() => {
          this.rooms = rooms ?? [];
          this.isLoading = false;
          this.errorMessage = '';
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load rooms', error);

        this.ngZone.run(() => {
          this.errorMessage = 'Failed to load rooms';
          this.rooms = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadHomes(): void {
    this.http.get<HomeItem[]>('/api/homes/my').subscribe({
      next: (homes) => {
        this.ngZone.run(() => {
          this.homes = homes ?? [];

          if (this.homes.length > 0 && !this.selectedHomeId) {
            this.selectedHomeId = this.homes[0].id;
          }

          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load homes', error);
      }
    });
  }

  openCreateModal(): void {
    this.newRoomName = '';
    this.errorMessage = '';

    if (this.homes.length > 0) {
      this.selectedHomeId = this.homes[0].id;
    } else {
      this.selectedHomeId = '';
    }

    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    if (this.isCreating) {
      return;
    }

    this.isCreateModalOpen = false;
    this.newRoomName = '';
    this.selectedHomeId = '';
  }

  createRoom(): void {
    const trimmedName = this.newRoomName.trim();

    if (!trimmedName || !this.selectedHomeId || this.isCreating) {
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';

    const payload: CreateRoomRequest = {
      name: trimmedName,
      homeId: this.selectedHomeId
    };

    this.http.post<RoomItem>('/api/rooms', payload).subscribe({
      next: (createdRoom) => {
        this.ngZone.run(() => {
          this.isCreating = false;
          this.closeCreateModal();
          this.router.navigate(['/room-editor', createdRoom.id]);
        });
      },
      error: (error) => {
        console.error('Failed to create room', error);

        this.ngZone.run(() => {
          this.errorMessage = 'Failed to create room';
          this.isCreating = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  openDeleteModal(room: RoomItem): void {
    if (this.isDeleting) {
      return;
    }

    this.roomToDelete = room;
    this.errorMessage = '';
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleteModalOpen = false;
    this.roomToDelete = null;
  }

  deleteRoom(): void {
    if (!this.roomToDelete || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    this.http.delete(`/api/rooms/${this.roomToDelete.id}`).subscribe({
      next: () => {
        this.ngZone.run(() => {
          const deletedRoomId = this.roomToDelete?.id;
          this.rooms = this.rooms.filter(room => room.id !== deletedRoomId);
          this.isDeleting = false;
          this.closeDeleteModal();
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to delete room', error);

        this.ngZone.run(() => {
          this.errorMessage = 'Failed to delete room';
          this.isDeleting = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  goToEditor(room: RoomItem): void {
    this.router.navigate(['/room-editor', room.id]);
  }

  trackByRoom(index: number, room: RoomItem): string {
    return room.id;
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  get canCreateRoom(): boolean {
    return !!this.newRoomName.trim() && !!this.selectedHomeId && !this.isCreating;
  }

  get hasHomes(): boolean {
    return this.homes.length > 0;
  }
}
