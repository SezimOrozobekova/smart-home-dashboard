import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Home3d } from './home3d/home3d';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'devices', loadComponent: () => import('./devices/devices').then(m => m.Devices) },
  { path: 'insights', loadComponent: () => import('./insights/insights').then(m => m.Insights) },
  { path: 'home3d', loadComponent: () => import('./home3d/home3d').then(m => m.Home3d) }
];
