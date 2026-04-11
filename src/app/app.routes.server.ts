import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'devices',
    renderMode: RenderMode.Client
  },
  {
    path: 'home3d',
    renderMode: RenderMode.Client
  },
  {
    path: 'room-editor',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
