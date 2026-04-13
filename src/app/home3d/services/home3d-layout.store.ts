import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RoomLayoutResponse } from '../models/room-layout.models';

@Injectable({
  providedIn: 'root'
})
export class Home3dLayoutStore {
  readonly rooms = signal<RoomLayoutResponse[]>([]);
  readonly currentRoomId = signal<string>('');
  readonly isLoading = signal(false);
  readonly error = signal('');

  readonly currentRoom = computed(() =>
    this.rooms().find(room => room.roomId === this.currentRoomId()) ?? null
  );

  constructor(private http: HttpClient) {}

  loadLayouts(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.http.get<RoomLayoutResponse[]>('/api/rooms/layouts/my').subscribe({
      next: (layouts) => {
        const data = layouts ?? [];

        this.rooms.set(data);

        if (data.length > 0 && !this.currentRoomId()) {
          this.currentRoomId.set(data[0].roomId);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load room layouts', error);
        this.error.set('Failed to load room layouts');
        this.isLoading.set(false);
      }
    });
  }

  selectRoom(roomId: string): void {
    this.currentRoomId.set(roomId);
  }

  clear(): void {
    this.rooms.set([]);
    this.currentRoomId.set('');
    this.error.set('');
    this.isLoading.set(false);
  }
}
