import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: 'devices',
    renderMode: RenderMode.Client
  },
  {
    path: 'home3d',
    renderMode: RenderMode.Client
  },
  {
    path: 'room-editor/:roomId',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  },
  { path: 'admin/**', renderMode: RenderMode.Client }
];
