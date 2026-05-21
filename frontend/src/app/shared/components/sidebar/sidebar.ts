import { Component, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavChild {
  label: string;
  route: string;
  icon: string;
}

interface NavGroup {
  label: string;
  icon: string;
  key: string;
  children: NavChild[];
}

interface NavItem {
  label: string;
  route?: string;
  icon: string;
  key: string;
  children?: NavChild[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.sass',
})
export class Sidebar {
  collapsed = signal(false);

  expandedGroups = signal<Set<string>>(new Set(['purchase', 'sales']));

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'home',
      key: 'dashboard',
    },
    {
      label: 'Purchase',
      icon: 'local_shipping',
      key: 'purchase',
      children: [
        { label: 'Purchase Requisition', route: '/supplier/purchase-requisition', icon: 'request_quote' },
        { label: 'Purchase Order', route: '/supplier/purchase-order', icon: 'shopping_cart' },
        { label: 'Purchase Bill', route: '/supplier/purchase-bill', icon: 'receipt_long' },
      ],
    },
    {
      label: 'Sales',
      icon: 'person',
      key: 'sales',
      children: [
        { label: 'Estimation', route: '/customer/estimation', icon: 'calculate' },
        { label: 'Sales Order', route: '/customer/sales-order', icon: 'assignment' },
        { label: 'Sales Invoice', route: '/customer/sales-invoice', icon: 'description' },
      ],
    },
    {
      label: 'Stock',
      route: '/stock',
      icon: 'inventory_2',
      key: 'stock',
    },
  ];

  toggleCollapse() {
    this.collapsed.update((v) => !v);
  }

  toggleGroup(key: string) {
    this.expandedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  isExpanded(key: string): boolean {
    return this.expandedGroups().has(key);
  }
}
