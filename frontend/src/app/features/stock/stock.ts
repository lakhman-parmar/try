import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, finalize, Subject } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { StockService } from './services/stock.service';
import { StockDetailModal } from './components/stock-detail-modal/stock-detail-modal';
import { PagedResult, StockListItemDto } from './models/stock.model';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    StockDetailModal,
  ],
  templateUrl: './stock.html',
  styleUrl: './stock.scss',
})
export class Stock implements OnInit {
  private readonly svc = inject(StockService);

  displayedColumns = ['name', 'stock', 'purchasePrice', 'sellingPrice', 'actions'];
  pageSize = 20;

  loading = signal(false);

  pagedResult = signal<PagedResult<StockListItemDto> | null>(null);
  searchTerm = signal('');
  currentPage = signal(1);

  readonly items = computed(() => this.pagedResult()?.items ?? []);
  readonly totalCount = computed(() => this.pagedResult()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.pagedResult()?.totalPages ?? 1);
  readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  hasFilters = computed(() => !!this.searchTerm());

  // Modal state
  modalProductId = signal<number | null>(null);
  modalProductName = signal<string>('');

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
        search: this.searchTerm() || undefined,
        pageNumber: this.currentPage(),
        pageSize: this.pageSize,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.pagedResult.set(res.data);
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.searchSubject.next();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadList();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadList();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadList();
  }

  openDetail(item: StockListItemDto): void {
    this.modalProductId.set(item.productId);
    this.modalProductName.set(item.name);
  }

  closeDetail(): void {
    this.modalProductId.set(null);
    this.modalProductName.set('');
  }

  minOf(a: number, b: number): number {
    return Math.min(a, b);
  }

  formatQty(val?: number | null): string {
    if (val == null) return '—';
    return val.toLocaleString('en-IN', { maximumFractionDigits: 3 });
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '—';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  stockStatus(qty?: number | null): 'ok' | 'low' | 'out' {
    if (qty == null || qty <= 0) return 'out';
    if (qty <= 10) return 'low';
    return 'ok';
  }
}
