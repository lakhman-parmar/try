import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, map, Observable, startWith } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SalesReturnService } from '../../services/sales-return.service';
import {
  CreateSalesReturnDto,
  CustomerDto,
  ReturnLineItem,
  SalesInvoiceForReturnDto,
  SalesInvoiceItemForReturnDto,
} from '../../models/sales-return.model';
import { MatFormField } from '@angular/material/form-field';

@Component({
  selector: 'app-sales-return-create',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatFormField,
  ],
  templateUrl: './sales-return-create.html',
  styleUrl: './sales-return-create.scss',
})
export class SalesReturnCreate implements OnInit {
  private readonly svc = inject(SalesReturnService);
  private readonly router = inject(Router);

  saving = signal(false);
  formRemarks = signal('');
  customers = signal<CustomerDto[]>([]);
  customerControl = new FormControl<CustomerDto | string>('', { nonNullable: true });
  filteredCustomers$!: Observable<CustomerDto[]>;
  customerId = signal<number | null>(null);
  selectedInvoiceId = signal<number | null>(null);
  showInvoicePanel = signal(false);
  lineItems = signal<ReturnLineItem[]>([]);
  displayedColumns = [
    'product',
    'unit',
    'invoiceQuantity',
    'returnedQuantity',
    'returnableQuantity',
    'quantity',
    'unitPrice',
    'actions',
  ];
  showConfirmModal = signal(false);

  allInvoices = signal<SalesInvoiceForReturnDto[]>([]);
  invoicePage = signal(1);
  invoiceTotalPages = signal(1);
  invoiceLoading = signal(false);
  invoiceLoadingMore = signal(false);
  invoiceLoaded = signal(false);

  readonly selectedInvoice = computed(() =>
    this.allInvoices().find((invoice) => invoice.salesInvoiceId === this.selectedInvoiceId()),
  );
  readonly subTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
  );
  readonly validLineCount = computed(() => this.lineItems().length);
  readonly canSave = computed(
    () => !!this.customerId() && !!this.selectedInvoiceId() && this.validLineCount() > 0,
  );

  ngOnInit(): void {
    this.filteredCustomers$ = this.customerControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterCustomers(value)),
    );
    this.loadCustomers();
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
    this.selectedInvoiceId.set(null);
    this.lineItems.set([]);
    this.showInvoicePanel.set(false);
    this.allInvoices.set([]);
    this.invoicePage.set(1);
    this.invoiceTotalPages.set(1);
    this.invoiceLoaded.set(false);
    this.loadInvoices();
  }

  onCustomerInput(value: string): void {
    if (value.trim()) return;
    this.customerId.set(null);
  }

  private filterCustomers(value: CustomerDto | string | null): CustomerDto[] {
    const search = typeof value === 'string' ? value : (value?.name ?? '');
    const filterValue = search.toLowerCase();
    return this.customers().filter((customer) => customer.name.toLowerCase().includes(filterValue));
  }

  toggleInvoicePanel(): void {
    this.showInvoicePanel.update((value) => !value);
  }

  isInvoiceSelected(id: number): boolean {
    return this.selectedInvoiceId() === id;
  }

  selectInvoice(invoice: SalesInvoiceForReturnDto): void {
    if (this.selectedInvoiceId() === invoice.salesInvoiceId) {
      this.unselectInvoice();
      return;
    }
    this.selectedInvoiceId.set(invoice.salesInvoiceId);
    this.lineItems.set(invoice.items.map((item) => this.invoiceItemToLineItem(item, invoice)));
    this.showInvoicePanel.set(false);
  }

  unselectInvoice(): void {
    this.selectedInvoiceId.set(null);
    this.lineItems.set([]);
  }

  private invoiceItemToLineItem(
    item: SalesInvoiceItemForReturnDto,
    invoice: SalesInvoiceForReturnDto,
  ): ReturnLineItem {
    return {
      productId: item.productId,
      productName: item.productName,
      unitShortName: item.unitShortName ?? '',
      invoiceQuantity: item.quantity,
      returnedQuantity: item.returnedQuantity,
      returnableQuantity: item.returnableQuantity,
      quantity: item.returnableQuantity,
      unitPrice: item.unitPrice ?? undefined,
      salesInvoiceId: invoice.salesInvoiceId,
      invoiceNumber: invoice.invoiceNumber,
      salesInvoiceItemId: item.salesInvoiceItemId,
    };
  }

  removeLineItem(index: number): void {
    this.lineItems.update((items) => items.filter((_, i) => i !== index));
  }

  updateQuantity(index: number, quantity: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.min(item.returnableQuantity, Math.max(1, quantity || 1)) }
          : item,
      ),
    );
  }

  adjustQuantity(index: number, delta: number): void {
    this.updateQuantity(index, (this.lineItems()[index]?.quantity ?? 1) + delta);
  }

  private adjustIntervals = new Map<string, ReturnType<typeof setInterval>>();

  startAdjust(index: number, delta: number): void {
    this.adjustQuantity(index, delta);
    const key = `${index}_${delta}`;
    if (!this.adjustIntervals.has(key)) {
      this.adjustIntervals.set(
        key,
        setInterval(() => this.adjustQuantity(index, delta), 150),
      );
    }
  }

  stopAdjust(index: number, delta: number): void {
    const key = `${index}_${delta}`;
    const interval = this.adjustIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.adjustIntervals.delete(key);
    }
  }

  requestCreateReturn(): void {
    this.showConfirmModal.set(true);
  }

  confirmCreateReturn(): void {
    const invoice = this.selectedInvoice();
    if (!invoice) return;

    this.showConfirmModal.set(false);
    const dto: CreateSalesReturnDto = {
      salesInvoiceId: invoice.salesInvoiceId,
      customerId: invoice.customerId,
      remarks: this.formRemarks() || undefined,
      items: this.lineItems().map((item) => ({
        productId: item.productId,
        salesInvoiceId: item.salesInvoiceId,
        salesInvoiceItemId: item.salesInvoiceItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? undefined,
      })),
    };

    this.saving.set(true);
    this.svc
      .create(dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.router.navigate(['/admin/sales/return']);
          }
        },
      });
  }

  cancelConfirm(): void {
    this.showConfirmModal.set(false);
  }

  cancel(): void {
    this.router.navigate(['/admin/sales/return']);
  }

  loadInvoices(): void {
    const custId = this.customerId();
    if (!custId) return;

    const page = this.invoicePage();
    this.invoiceLoading.set(page === 1);
    this.invoiceLoadingMore.set(page > 1);

    this.svc
      .getInvoicesForReturn(custId, page, 20)
      .pipe(
        finalize(() => {
          this.invoiceLoading.set(false);
          this.invoiceLoadingMore.set(false);
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.allInvoices.update((prev) => [...prev, ...res.data.items]);
            this.invoiceTotalPages.set(res.data.totalPages);
            this.invoiceLoaded.set(true);
          }
        },
      });
  }

  onInvoiceScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom && !this.invoiceLoadingMore() && this.invoicePage() < this.invoiceTotalPages()) {
      this.invoicePage.update((p) => p + 1);
      this.loadInvoices();
    }
  }

  formatCurrency(val?: number | null): string {
    return val == null
      ? '-'
      : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
