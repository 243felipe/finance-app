import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((c) => c.LoginComponent)
  },
  {
    path: 'produtos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/products/products.component').then((c) => c.ProductsComponent)
  },
  { path: '**', redirectTo: 'login' }
];
