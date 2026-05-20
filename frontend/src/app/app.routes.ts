import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { AdminHome } from './features/admin/home/admin-home';

export const routes: Routes = [
  {
    path: '',
    component: Login,
  },
  {
    path: 'admin/home',
    component: AdminHome,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
