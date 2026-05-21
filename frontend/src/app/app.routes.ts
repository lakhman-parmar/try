import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Layout } from './shared/components/layout/layout';
import { Dashboard } from './features/dashboard/components/dashboard';
import { PurchaseRequisition } from './features/purchase/purchase-requisition/purchase-requisition';
import { PurchaseRequisitionCreate } from './features/purchase/purchase-requisition/components/purchase-requisition-create/purchase-requisition-create';
import { PurchaseRequisitionUpdate } from './features/purchase/purchase-requisition/components/purchase-requisition-update/purchase-requisition-update';
import { PurchaseOrder } from './features/purchase/purchase-order/purchase-order';
import { PurchaseBill } from './features/purchase/purchase-bill/purchase-bill';
import { guestGuard } from './core/guards/guest-guard';
import { authGuard } from './core/guards/auth-guard';
import { UserProfile } from './features/user-profile/components/user-profile';

export const routes: Routes = [
  {
    path: '',
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: 'admin',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'purchase/requisition',
        children: [
          { path: '', component: PurchaseRequisition },
          { path: 'create', component: PurchaseRequisitionCreate },
          { path: ':id', component: PurchaseRequisitionUpdate },
        ],
      },
      {
        path: 'purchase/order',
        component: PurchaseOrder,
      },
      {
        path: 'purchase/bill',
        component: PurchaseBill,
      },
      {
        path: 'profile',
        component: UserProfile,
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
