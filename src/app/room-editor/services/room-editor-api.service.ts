import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { EditorModelItem } from './room-editor-models';

interface DeviceTypeResponse {
  id: string;
  code: string;
  name: string;
  category: string;
  icon: string | null;
  isControllable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveLayoutRequest {
  roomWidth: number
  roomDepth: number
  items: any[]
}

@Injectable({
  providedIn: 'root'
})
export class RoomEditorApiService {
  private readonly endpoint = '/api/device-types';

  constructor(private http: HttpClient) {}

  getEditorModels(): Observable<EditorModelItem[]> {
    return this.http.get<DeviceTypeResponse[]>(this.endpoint).pipe(
      map((deviceTypes) =>
        deviceTypes
          .filter((item) => item.isActive)
          .map((item) => ({
            id: item.id,
            name: item.name,
            path: `/assets/models/${item.code.toLowerCase()}.glb`,
            scale: 2
          }))
      )
    );
  }

  saveLayout(roomId: string, payload: SaveLayoutRequest) {
    return this.http.put(`/api/rooms/${roomId}/layout`, payload)
  }
}
