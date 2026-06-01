import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Layout } from './shared/components/layout/layout';
import { Dashboard } from './features/dashboard/components/dashboard';
import { PurchaseRequisition } from './features/purchase/purchase-requisition/purchase-requisition';
import { PurchaseRequisitionCreate } from './features/purchase/purchase-requisition/components/purchase-requisition-create/purchase-requisition-create';
import { PurchaseRequisitionUpdate } from './features/purchase/purchase-requisition/components/purchase-requisition-update/purchase-requisition-update';
import { PurchaseOrder } from './features/purchase/purchase-order/purchase-order';
import { PurchaseOrderCreate } from './features/purchase/purchase-order/components/purchase-order-create/purchase-order-create';
import { PurchaseOrderDetail } from './features/purchase/purchase-order/components/purchase-order-detail/purchase-order-detail';
import { PurchaseBill } from './features/purchase/purchase-bill/purchase-bill';
import { SalesOrder } from './features/sales/sales-order/sales-order';
import { SalesOrderForm } from './features/sales/sales-order/components/sales-order-form/sales-order-form';
import { PurchaseBillCreate } from './features/purchase/purchase-bill/components/purchase-bill-create/purchase-bill-create';
import { PurchaseBillRegenerate } from './features/purchase/purchase-bill/components/purchase-bill-regenerate/purchase-bill-regenerate';
import { guestGuard } from './core/guards/guest-guard';
import { authGuard } from './core/guards/auth-guard';
import { UserProfile } from './features/user-profile/components/user-profile';
import { Stock } from './features/stock/stock';
import { PurchaseReturn } from './features/purchase/purchase-return/purchase-return';
import { PurchaseReturnCreate } from './features/purchase/purchase-return/components/purchase-return-create/purchase-return-create';

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
        children: [
          { path: '', component: PurchaseOrder },
          { path: 'create', component: PurchaseOrderCreate },
          { path: ':id', component: PurchaseOrderDetail },
        ],
      },
      {
        path: 'purchase/bill',
        children: [
          { path: '', component: PurchaseBill },
          { path: 'create', component: PurchaseBillCreate },
          { path: 'regenerate/:id', component: PurchaseBillRegenerate },
        ],
      },
      {
        path: 'purchase/return',
        children: [
          {
            path: '', component: PurchaseReturn
          },
          {
            path: 'create', component: PurchaseReturnCreate
          },
        ],
      },
      {
        path: 'sales/estimation',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sales/estimation/estimation').then((m) => m.Estimation),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/sales/estimation/components/estimation-form/estimation-form').then(
                (m) => m.EstimationForm,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/sales/estimation/components/estimation-form/estimation-form').then(
                (m) => m.EstimationForm,
              ),
          },
        ],
      },
      {
        path: 'sales/order',
        children: [
          { path: '', component: SalesOrder },
          { path: 'create', component: SalesOrderForm },
          { path: ':id', component: SalesOrderForm },
        ],
      },
      {
        path: 'sales/invoice',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sales/sales-invoice/sales-invoice').then((m) => m.SalesInvoice),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/sales/sales-invoice/components/sales-invoice-create/sales-invoice-create').then(
                (m) => m.SalesInvoiceCreate,
              ),
          },
          {
            path: 'regenerate/:id',
            loadComponent: () =>
              import('./features/sales/sales-invoice/components/sales-invoice-regenerate/sales-invoice-regenerate').then(
                (m) => m.SalesInvoiceRegenerate,
              ),
          },
        ],
      },
      {
        path: 'sales/return',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sales/sales-return/sales-return').then((m) => m.SalesReturn),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/sales/sales-return/components/sales-return-create/sales-return-create').then(
                (m) => m.SalesReturnCreate,
              ),
          },
        ],
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
      {
        path: 'stock',
        component: Stock,
      },
    ],
  },

  {
    path: '**',
    redirectTo: '',
  },
];
