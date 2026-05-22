import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, finalize, map, startWith } from 'rxjs';
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
  EstimationDetailDto,
  EstimationListItemDto,
  PagedResult,
} from './models/estimation.model';
import { EstimationService } from './services/estimation.service';

@Component({
  selector: 'app-estimation',
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
  templateUrl: './estimation.html',
  styleUrl: './estimation.scss',
})
export class Estimation implements OnInit {
  private readonly svc = inject(EstimationService);
  private readonly router = inject(Router);

  displayedColumns = ['toggle', 'number', 'customer', 'remarks', 'items', 'date', 'actions'];
  pageSize = 20;

  loading = signal(false);
  detailLoading = signal(false);
  errorMsg = signal<string | null>(null);
  pagedResult = signal<PagedResult<EstimationListItemDto> | null>(null);
  customers = signal<CustomerDto[]>([]);
  expandedId = signal<number | null>(null);
  expandedDetail = signal<EstimationDetailDto | null>(null);
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

  ngOnInit(): void {
    this.filteredCustomers$ = this.customerControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterCustomers(value)),
    );
    this.loadCustomers();
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

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
        error: () => this.errorMsg.set('Failed to load estimations.'),
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
        error: () => this.errorMsg.set('Failed to load estimation details.'),
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
    this.router.navigate(['/admin/sales/estimation/create']);
  }

  openEdit(id: number): void {
    this.router.navigate(['/admin/sales/estimation', id]);
  }

  deleteEstimation(id: number): void {
    if (!confirm('Delete this estimation?')) return;

    this.svc.delete(id).subscribe({
      next: (res) => {
        if (res.isSuccess) this.loadList();
      },
      error: () => this.errorMsg.set('Failed to delete estimation.'),
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
