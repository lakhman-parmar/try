import { Component, signal, input, output, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  collapsed = signal(false);
  mobileOpen = input(false);
  mobileClose = output();

  expandedGroups = signal<Set<string>>(new Set(['purchase', 'sales']));

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: 'home',
      key: 'dashboard',
    },
    {
      label: 'Purchase',
      icon: 'local_shipping',
      key: 'purchase',
      children: [
        { label: 'Purchase Requisition', route: '/admin/purchase/requisition', icon: 'request_quote' },
        { label: 'Purchase Order', route: '/admin/purchase/order', icon: 'shopping_cart' },
        { label: 'Purchase Bill', route: '/admin/purchase/bill', icon: 'receipt_long' },
      ],
    },
    {
      label: 'Sales',
      icon: 'person',
      key: 'sales',
      children: [
        { label: 'Estimation', route: '/admin/sales/estimation', icon: 'calculate' },
        { label: 'Sales Order', route: '/admin/sales/order', icon: 'assignment' },
        { label: 'Sales Invoice', route: '/admin/sales/invoice', icon: 'description' },
      ],
    },
    {
      label: 'Stock',
      route: '/admin/stock',
      icon: 'inventory_2',
      key: 'stock',
    },
  ];

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileOpen()) this.mobileClose.emit();
  }

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
