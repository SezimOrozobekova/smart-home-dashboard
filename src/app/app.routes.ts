import { Routes } from '@angular/router';
import { Dashboard } from './main-dashboard/dashboard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then(m => m.Register)
  },
  {
    path: '',
    component: Dashboard,
    canActivate: [authGuard]
  },
  {
    path: 'devices',
    loadComponent: () => import('./devices/devices').then(m => m.Devices),
    canActivate: [authGuard]
  },
  {
    path: 'home3d',
    loadComponent: () => import('./home3d/home3d').then(m => m.Home3d),
    canActivate: [authGuard]
  },
  {
    path: 'room-editor/:roomId',
    loadComponent: () => import('./room-editor/room-editor').then(m => m.RoomEditor),
    canActivate: [authGuard],
  },
  {
    path: 'statistics/device/:id',
    loadComponent: () => import('./statistics/statistics').then(m => m.Statistics),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'rooms',
        pathMatch: 'full'
      },
      {
        path: 'rooms',
        loadComponent: () =>
          import('./admin-dashboard/pages/rooms/rooms-page').then(m => m.RoomsPage)
      },
      {
        path: 'devices',
        loadComponent: () =>
          import('./admin-dashboard/pages/devices/devices-page').then(m => m.DevicesPage)
      },
      {
        path: 'homes',
        loadComponent: () =>
          import('./admin-dashboard/pages/homes/homes-page').then(m => m.HomesPage)
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./admin-dashboard/pages/statistics/statistics-page').then(m => m.StatisticsPage)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
