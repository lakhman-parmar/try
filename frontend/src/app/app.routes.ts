import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Layout } from './shared/components/layout/layout';
import { Dashboard } from './features/dashboard/components/dashboard';
import { PurchaseRequisition } from './features/purchase/purchase-requisition/purchase-requisition';
import { PurchaseOrder } from './features/purchase/purchase-order/purchase-order';
import { PurchaseBill } from './features/purchase/purchase-bill/purchase-bill';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: '',
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: 'admin',
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
    path: '**',
    redirectTo: '',
  },
];
