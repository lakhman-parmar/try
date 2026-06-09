import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, finalize, Subject } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SalesInvoiceService } from './services/sales-invoice.service';
import {
  PagedResult,
  SalesInvoiceDetailDto,
  SalesInvoiceListItemDto,
} from './models/sales-invoice.model';
import { downloadSalesInvoicePdf } from './utils/sales-invoice-pdf.util';

@Component({
  selector: 'app-sales-invoice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterLink,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './sales-invoice.html',
  styleUrl: './sales-invoice.scss',
})
export class SalesInvoice implements OnInit {
  private readonly svc = inject(SalesInvoiceService);
  private readonly router = inject(Router);

  displayedColumns = ['toggle', 'number', 'customer', 'items', 'totalAmount', 'date', 'actions'];
  detailColumns = ['detail'];
  pageSize = 20;
  loading = signal(false);
  pagedResult = signal<PagedResult<SalesInvoiceListItemDto> | null>(null);
  searchTerm = signal('');
  fromDate = signal<Date | null>(null);
  toDate = signal<Date | null>(null);
  currentPage = signal(1);
  expandedId = signal<number | null>(null);
  expandedDetail = signal<SalesInvoiceDetailDto | null>(null);
  expandLoading = signal(false);

  readonly items = computed(() => this.pagedResult()?.items ?? []);
  readonly totalCount = computed(() => this.pagedResult()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.pagedResult()?.totalPages ?? 1);
  readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  hasFilters = computed(() => !!(this.searchTerm() || this.fromDate() || this.toDate()));

  private searchSubject = new Subject<void>();

  ngOnInit(): void {
    this.loadList();
    this.searchSubject.pipe(debounceTime(350)).subscribe(() => this.applyFilters());
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
      });
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
    this.router.navigate(['/admin/sales/invoice/create']);
  }

  printInvoice(id: number, event: Event): void {
    event.stopPropagation();
    this.svc.getById(id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          downloadSalesInvoicePdf(res.data);
        }
      },
    });
  }

  minOf(a: number, b: number): number {
    return Math.min(a, b);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '-';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private toQueryDate(date: Date | null): string | undefined {
    if (!date) return undefined;
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
  }
}
