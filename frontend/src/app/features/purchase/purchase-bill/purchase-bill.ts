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
import { PurchaseBillService } from './services/purchase-bill.sevice';
import {
  PagedResult,
  PurchaseBillDetailDto,
  PurchaseBillListItemDto,
} from './models/purchase-bill.model';

@Component({
  selector: 'app-purchase-bill',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-bill.html',
  styleUrl: './purchase-bill.scss',
})
export class PurchaseBill implements OnInit {
  private readonly svc = inject(PurchaseBillService);
  private readonly router = inject(Router);

  // ── List state ───────────────────────────────────────────────────────────────
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  pagedResult = signal<PagedResult<PurchaseBillListItemDto> | null>(null);
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

  // ── Expand row (detail inline) ────────────────────────────────────────────
  expandedId = signal<number | null>(null);
  expandedDetail = signal<PurchaseBillDetailDto | null>(null);
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
        next: (res) => { if (res.isSuccess) this.pagedResult.set(res.data); },
        error: () => this.errorMsg.set('Failed to load purchase bills.'),
      });
  }

  private loadList(): void {
    this.loading.set(true);
    this.svc
      .getAll({
        search: this.searchTerm() || undefined,
        fromDate: this.fromDate() || undefined,
        toDate: this.toDate() || undefined,
        pageNumber: this.currentPage(),
        pageSize: this.pageSize,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => { if (res.isSuccess) this.pagedResult.set(res.data); },
        error: () => this.errorMsg.set('Failed to load purchase bills.'),
      });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  openCreateForm(): void {
    this.router.navigate(['/admin/purchase/bill/create']);
  }

  openRegeneratePage(id: number): void {
    this.router.navigate(['/admin/purchase/bill/regenerate', id]);
  }

  // ── List interaction ──────────────────────────────────────────────────────
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
        next: (res) => { if (res.isSuccess) this.expandedDetail.set(res.data); },
        error: () => this.errorMsg.set('Failed to load bill details.'),
      });
  }

  isExpanded(id: number): boolean {
    return this.expandedId() === id;
  }

  get hasFilters(): boolean {
    return !!(this.searchTerm() || this.fromDate() || this.toDate());
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '\u2014';
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

  minOf(a: number, b: number): number {
    return Math.min(a, b);
  }
}
