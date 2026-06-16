import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, finalize, map, Observable, startWith, Subject } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SalesReturnService } from './services/sales-return.service';
import {
  CustomerDto,
  PagedResult,
  SalesReturnDetailDto,
  SalesReturnListItemDto,
} from './models/sales-return.model';

@Component({
  selector: 'app-sales-return',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './sales-return.html',
  styleUrl: './sales-return.scss',
})
export class SalesReturn implements OnInit {
  private readonly svc = inject(SalesReturnService);
  private readonly router = inject(Router);

  displayedColumns = ['toggle', 'number', 'invoice', 'customer', 'items', 'totalAmount', 'date'];
  detailColumns = ['detail'];
  pageSize = 10;
  loading = signal(false);
  pagedResult = signal<PagedResult<SalesReturnListItemDto> | null>(null);
  customers = signal<CustomerDto[]>([]);
  customerControl = new FormControl<CustomerDto | string>('', { nonNullable: true });
  filteredCustomers$!: Observable<CustomerDto[]>;
  searchTerm = signal('');
  fromDate = signal<Date | null>(null);
  toDate = signal<Date | null>(null);
  customerId = signal<number | null>(null);
  currentPage = signal(0);
  expandedId = signal<number | null>(null);
  expandedDetail = signal<SalesReturnDetailDto | null>(null);
  expandLoading = signal(false);

  readonly items = computed(() => this.pagedResult()?.items ?? []);
  readonly totalCount = computed(() => this.pagedResult()?.totalCount ?? 0);
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
    this.searchSubject.pipe(debounceTime(350)).subscribe(() => this.applyFilters());
  }

  private loadList(): void {
    this.loading.set(true);
    this.svc
      .getAll({
        search: this.searchTerm() || undefined,
        fromDate: this.toQueryDate(this.fromDate()),
        toDate: this.toQueryDate(this.toDate()),
        customerId: this.customerId() ?? undefined,
        pageNumber: this.currentPage() + 1,
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
    this.currentPage.set(0);
    this.searchSubject.next();
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.expandedId.set(null);
    this.expandedDetail.set(null);
    this.loadList();
  }

  private loadCustomers(): void {
    this.svc.getCustomers().subscribe({
      next: (res) => {
        if (res.isSuccess) this.customers.set(res.data);
        this.customerControl.setValue(this.customerControl.value ?? '');
      },
    });
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

  clearFilters(): void {
    this.searchTerm.set('');
    this.customerControl.setValue('', { emitEvent: false });
    this.fromDate.set(null);
    this.toDate.set(null);
    this.customerId.set(null);
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize = event.pageSize;
    this.expandedId.set(null);
    this.expandedDetail.set(null);
    this.loadList();
  }

  openCreateForm(): void {
    this.router.navigate(['/admin/sales/return/create']);
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

  private filterCustomers(value: CustomerDto | string | null): CustomerDto[] {
    const search = typeof value === 'string' ? value : (value?.name ?? '');
    const filterValue = search.toLowerCase();
    return this.customers().filter((customer) => customer.name.toLowerCase().includes(filterValue));
  }
}
