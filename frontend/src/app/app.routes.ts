import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Layout } from './shared/components/layout/layout';
import { Dashboard } from './features/dashboard/components/dashboard';
import { PurchaseRequisition } from './features/purchase/purchase-requisition/purchase-requisition';
import { PurchaseOrder } from './features/purchase/purchase-order/purchase-order';
import { PurchaseBill } from './features/purchase/purchase-bill/purchase-bill';
import { AdminHome } from './features/admin/home/admin-home';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    component: Layout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'supplier/purchase-requisition',
        component: PurchaseRequisition,
      },
      {
        path: 'supplier/purchase-order',
        component: PurchaseOrder,
      },
      {
        path: 'supplier/purchase-bill',
        component: PurchaseBill,
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
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
