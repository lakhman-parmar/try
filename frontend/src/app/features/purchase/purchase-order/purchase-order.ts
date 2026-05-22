import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap, finalize } from 'rxjs';
import { PurchaseOrderService } from './services/purchase-order.service';
import {
  PagedResult,
  PurchaseOrderDetailDto,
  PurchaseOrderListItemDto,
} from './models/purchase-order.model';

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-order.html',
  styleUrl: './purchase-order.scss',
})
export class PurchaseOrder implements OnInit {
  private readonly svc = inject(PurchaseOrderService);
  private readonly router = inject(Router);

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  pagedResult = signal<PagedResult<PurchaseOrderListItemDto> | null>(null);
  searchTerm = signal('');
  fromDate = signal('');
  toDate = signal('');
  currentPage = signal(1);
  pageSize = 20;

  readonly items = computed(() => this.pagedResult()?.items ?? []);
  readonly totalCount = computed(() => this.pagedResult()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.pagedResult()?.totalPages ?? 1);
  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  // Expandable row state
  expandedId = signal<number | null>(null);
  expandedDetail = signal<PurchaseOrderDetailDto | null>(null);
  expandLoading = signal(false);

  private searchSubject = new Subject<void>();

  ngOnInit(): void {
    this.loadList();

    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(() => {
          this.loading.set(true);
          return this.svc
            .getAll({
              search: this.searchTerm(),
              fromDate: this.fromDate() || undefined,
              toDate: this.toDate() || undefined,
              pageNumber: this.currentPage(),
              pageSize: this.pageSize,
            })
            .pipe(finalize(() => this.loading.set(false)));
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.pagedResult.set(res.data);
        },
        error: () => this.errorMsg.set('Failed to load purchase orders.'),
      });
  }

  private loadList(): void {
    this.loading.set(true);
    this.svc
      .getAll({
        search: this.searchTerm(),
        fromDate: this.fromDate() || undefined,
        toDate: this.toDate() || undefined,
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

  onDateChange(): void {
    this.currentPage.set(1);
    this.loadList();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.fromDate.set('');
    this.toDate.set('');
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

  get hasFilters(): boolean {
    return !!(this.searchTerm() || this.fromDate() || this.toDate());
  }
}
