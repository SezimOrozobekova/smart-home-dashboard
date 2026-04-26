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
  roomWidth: number;
  roomDepth: number;
  items: any[];
}

export interface RoomLayoutResponse {
  roomId: string;
  roomName: string;
  roomWidth: number;
  roomDepth: number;
  items: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RoomEditorApiService {
  private readonly deviceTypesEndpoint = '/api/device-types';
  private readonly roomsEndpoint = '/api/rooms';

  constructor(private http: HttpClient) {}

  getEditorModels(): Observable<EditorModelItem[]> {
    return this.http.get<DeviceTypeResponse[]>(this.deviceTypesEndpoint).pipe(
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

  getLayout(roomId: string): Observable<RoomLayoutResponse> {
    return this.http.get<RoomLayoutResponse>(
      `${this.roomsEndpoint}/${roomId}/layout`
    );
  }

  saveLayout(roomId: string, payload: SaveLayoutRequest) {
    return this.http.put(`${this.roomsEndpoint}/${roomId}/layout`, payload);
  }
}
