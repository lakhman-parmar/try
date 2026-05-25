import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, Subject, finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PurchaseOrderService } from './services/purchase-order.service';
import {
  PagedResult,
  PurchaseOrderDetailDto,
  PurchaseOrderListItemDto,
} from './models/purchase-order.model';

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './purchase-order.html',
  styleUrl: './purchase-order.scss',
})
export class PurchaseOrder implements OnInit {
  private readonly svc = inject(PurchaseOrderService);
  private readonly router = inject(Router);

  displayedColumns = [
    'toggle',
    'number',
    'supplier',
    'remarks',
    'items',
    'subtotal',
    'date',
    'actions',
  ];
  detailColumns = ['detail'];
  pageSize = 20;

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  pagedResult = signal<PagedResult<PurchaseOrderListItemDto> | null>(null);
  searchTerm = signal('');
  fromDate = signal<Date | null>(null);
  toDate = signal<Date | null>(null);
  currentPage = signal(1);

  readonly items = computed(() => this.pagedResult()?.items ?? []);
  readonly totalCount = computed(() => this.pagedResult()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.pagedResult()?.totalPages ?? 1);
  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );
  hasFilters = computed(() => !!(this.searchTerm() || this.fromDate() || this.toDate()));

  // Expandable row state
  expandedId = signal<number | null>(null);
  expandedDetail = signal<PurchaseOrderDetailDto | null>(null);
  expandLoading = signal(false);

  private searchSubject = new Subject<void>();

  ngOnInit(): void {
    this.loadList();

    this.searchSubject.pipe(debounceTime(350)).subscribe(() => {
      this.applyFilters();
    });
  }

  private loadList(): void {
    this.loading.set(true);
    this.svc
      .getAll({
        search: this.searchTerm(),
        fromDate: this.toQueryDate(this.fromDate()),
        toDate: this.toQueryDate(this.toDate()),
        pageNumber: this.currentPage(),
        pageSize: this.pageSize,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.pagedResult.set(res.data);
        },
        error: () => this.errorMsg.set('Failed to load purchase orders.'),
      });
  }

  toggleExpand(id: number, event: Event): void {
    event.stopPropagation();
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.expandedDetail.set(null);
      return;
    }
    this.expandedId.set(id);
    this.expandedDetail.set(null);
    this.expandLoading.set(true);
    this.svc
      .getById(id)
      .pipe(finalize(() => this.expandLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.expandedDetail.set(res.data);
        },
        error: () => this.errorMsg.set('Failed to load order details.'),
      });
  }

  isExpanded(id: number): boolean {
    return this.expandedId() === id;
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.searchSubject.next();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.expandedId.set(null);
    this.expandedDetail.set(null);
    this.loadList();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.fromDate.set(null);
    this.toDate.set(null);
    this.currentPage.set(1);
    this.loadList();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.expandedId.set(null);
    this.expandedDetail.set(null);
    this.loadList();
  }

  openCreateForm(): void {
    this.router.navigate(['/admin/purchase/order/create']);
  }

  openDetail(id: number): void {
    this.router.navigate(['/admin/purchase/order', id]);
  }

  deleteOrder(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Delete this purchase order? This action cannot be undone.')) return;
    this.svc.delete(id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          if (this.expandedId() === id) {
            this.expandedId.set(null);
            this.expandedDetail.set(null);
          }
          this.loadList();
        }
      },
      error: () => this.errorMsg.set('Failed to delete purchase order.'),
    });
  }

  minOf(a: number, b: number): number {
    return Math.min(a, b);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '—';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  expandedSubTotal(): number {
    const detail = this.expandedDetail();
    if (!detail) return 0;
    return detail.items.reduce(
      (sum, item) => sum + (item.unitPrice != null ? item.quantity * item.unitPrice : 0),
      0,
    );
  }

  private toQueryDate(date: Date | null): string | undefined {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
