import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShell } from './layout/app-shell/app-shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'users',
        title: 'User management',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] },
        loadComponent: () => import('./pages/users/users').then((m) => m.Users),
      },
      {
        path: 'gallery',
        title: 'Image gallery',
        loadComponent: () => import('./pages/gallery/gallery').then((m) => m.Gallery),
      },
      {
        path: 'drive',
        title: 'Files & folders',
        loadComponent: () => import('./pages/drive/drive').then((m) => m.Drive),
      },
      {
        path: 'no-access',
        title: 'No access',
        loadComponent: () => import('./pages/no-access/no-access').then((m) => m.NoAccess),
      },
    ],
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
