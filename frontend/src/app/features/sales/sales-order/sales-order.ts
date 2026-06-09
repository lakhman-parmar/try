import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, debounceTime, finalize, map, startWith } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import {
  CustomerDto,
  PagedResult,
  SalesOrderDetailDto,
  SalesOrderListItemDto,
} from './models/sales-order.model';
import { SalesOrderService } from './services/sales-order.service';

@Component({
  selector: 'app-sales-order',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './sales-order.html',
  styleUrl: './sales-order.scss',
})
export class SalesOrder implements OnInit {
  private readonly svc = inject(SalesOrderService);
  private readonly router = inject(Router);

  displayedColumns = [
    'toggle',
    'number',
    'customer',
    'remarks',
    'items',
    'subtotal',
    'date',
    'actions',
  ];
  detailColumns = ['detail'];
  pageSize = 10;

  loading = signal(false);
  detailLoading = signal(false);
  pagedResult = signal<PagedResult<SalesOrderListItemDto> | null>(null);
  customers = signal<CustomerDto[]>([]);
  expandedId = signal<number | null>(null);
  expandedDetail = signal<SalesOrderDetailDto | null>(null);
  customerControl = new FormControl<CustomerDto | string>('', { nonNullable: true });
  filteredCustomers$!: Observable<CustomerDto[]>;

  searchTerm = signal('');
  fromDate = signal<Date | null>(null);
  toDate = signal<Date | null>(null);
  customerId = signal<number | null>(null);
  currentPage = signal(1);

  items = computed(() => this.pagedResult()?.items ?? []);
  totalCount = computed(() => this.pagedResult()?.totalCount ?? 0);
  totalPages = computed(() => this.pagedResult()?.totalPages ?? 1);
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  hasFilters = computed(
    () => !!(this.searchTerm() || this.fromDate() || this.toDate() || this.customerId()),
  );

  private searchSubject = new Subject<void>();

  ngOnInit(): void {
    this.filteredCustomers$ = this.customerControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterCustomers(value)),
    );
    this.loadCustomers();
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
        fromDate: this.toQueryDate(this.fromDate()),
        toDate: this.toQueryDate(this.toDate()),
        customerId: this.customerId() ?? undefined,
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

  private loadCustomers(): void {
    this.svc.getCustomers().subscribe({
      next: (res) => {
        if (res.isSuccess) this.customers.set(res.data);
        this.customerControl.setValue(this.customerControl.value ?? '');
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
    this.customerControl.setValue('', { emitEvent: false });
    this.fromDate.set(null);
    this.toDate.set(null);
    this.customerId.set(null);
    this.applyFilters();
  }

  displayCustomer(customer: CustomerDto | string | null): string {
    return typeof customer === 'string' ? customer : (customer?.name ?? '');
  }

  onCustomerSelected(customer: CustomerDto): void {
    this.customerId.set(customer.customerId);
    this.applyFilters();
  }

  onCustomerInput(value: string): void {
    if (value.trim()) return;
    this.customerId.set(null);
    this.applyFilters();
  }

  toggleExpand(id: number): void {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.expandedDetail.set(null);
      return;
    }

    this.expandedId.set(id);
    this.expandedDetail.set(null);
    this.detailLoading.set(true);

    this.svc
      .getById(id)
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.expandedDetail.set(res.data);
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.expandedId.set(null);
    this.expandedDetail.set(null);
    this.loadList();
  }

  openCreateForm(): void {
    this.router.navigate(['/admin/sales/order/create']);
  }

  openEdit(id: number): void {
    this.router.navigate(['/admin/sales/order', id]);
  }

  deleteOrder(id: number): void {
    if (!confirm('Delete this sales order? This action cannot be undone.')) return;

    this.svc.delete(id).subscribe({
      next: (res) => {
        if (res.isSuccess) this.loadList();
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

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private filterCustomers(value: CustomerDto | string | null): CustomerDto[] {
    const search = typeof value === 'string' ? value : (value?.name ?? '');
    const filterValue = search.toLowerCase();

    return this.customers().filter((customer) => customer.name.toLowerCase().includes(filterValue));
  }
}
