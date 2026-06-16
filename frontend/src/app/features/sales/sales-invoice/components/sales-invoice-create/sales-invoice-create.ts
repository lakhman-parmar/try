import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, map, Observable, startWith } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SalesInvoiceService } from '../../services/sales-invoice.service';
import {
  CreateSalesInvoiceDto,
  CustomerDto,
  InvoiceLineItem,
  ProductDto,
  SalesOrderForInvoiceDto,
  SalesOrderItemForInvoiceDto,
} from '../../models/sales-invoice.model';

@Component({
  selector: 'app-sales-invoice-create',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './sales-invoice-create.html',
  styleUrl: './sales-invoice-create.scss',
})
export class SalesInvoiceCreate implements OnInit {
  private readonly svc = inject(SalesInvoiceService);
  private readonly router = inject(Router);

  saving = signal(false);
  formTaxPercentage = signal<number | null>(null);
  formRemarks = signal('');
  customerId = signal<number | null>(null);
  customerControl = new FormControl<CustomerDto | string>('', { nonNullable: true });
  filteredCustomers$!: Observable<CustomerDto[]>;
  customers = signal<CustomerDto[]>([]);
  loadingCustomers = signal(false);
  ordersForInvoice = signal<SalesOrderForInvoiceDto[]>([]);
  loadingOrders = signal(false);
  selectedSoIds = signal<Set<number>>(new Set());
  showSoPanel = signal(false);
  lineItems = signal<InvoiceLineItem[]>([]);
  products = signal<ProductDto[]>([]);
  loadingProducts = signal(false);
  productControls: FormControl<ProductDto | string>[] = [];
  filteredProductOptions: Observable<ProductDto[]>[] = [];
  displayedColumns = ['product', 'unit', 'quantity', 'unitPrice', 'stock', 'source', 'actions'];
  showConfirmModal = signal(false);

  readonly subTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
  );
  readonly taxAmount = computed(() =>
    this.formTaxPercentage() ? (this.subTotal() * this.formTaxPercentage()!) / 100 : 0,
  );
  readonly grandTotal = computed(() => this.subTotal() + this.taxAmount());
  readonly validLineCount = computed(
    () => this.lineItems().filter((item) => item.productId).length,
  );
  readonly canSave = computed(() => this.customerId() != null && this.validLineCount() > 0);

  ngOnInit(): void {
    this.filteredCustomers$ = this.customerControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterCustomers(value)),
    );
    this.loadingProducts.set(true);
    this.loadingCustomers.set(true);
    forkJoin({
      products: this.svc.getProducts(),
      customers: this.svc.getCustomers(),
    })
      .pipe(
        finalize(() => {
          this.loadingProducts.set(false);
          this.loadingCustomers.set(false);
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.products.isSuccess) this.products.set(res.products.data);
          if (res.customers.isSuccess) this.customers.set(res.customers.data);
          this.customerControl.setValue(this.customerControl.value ?? '');
          this.addDirectLineItem();
        },
      });
  }

  private loadOrders(customerId: number): void {
    this.loadingOrders.set(true);
    this.svc.getOrdersForInvoice(customerId).subscribe({
      next: (res) => {
        if (res.isSuccess) this.ordersForInvoice.set(res.data);
        this.loadingOrders.set(false);
      },
      error: () => this.loadingOrders.set(false),
    });
  }

  displayCustomer(customer: CustomerDto | string | null): string {
    return typeof customer === 'string' ? customer : (customer?.name ?? '');
  }

  onCustomerSelected(customer: CustomerDto): void {
    this.customerId.set(customer.customerId);
    this.selectedSoIds.set(new Set());
    this.lineItems.set([]);
    this.productControls = [];
    this.filteredProductOptions = [];
    this.addDirectLineItem();
    this.loadOrders(customer.customerId);
  }

  onCustomerInput(value: string): void {
    if (value.trim()) return;
    this.customerId.set(null);
    this.ordersForInvoice.set([]);
    this.selectedSoIds.set(new Set());
    this.lineItems.set([]);
    this.productControls = [];
    this.filteredProductOptions = [];
    this.addDirectLineItem();
  }

  toggleSoPanel(): void {
    this.showSoPanel.update((value) => !value);
  }
  isSoSelected(id: number): boolean {
    return this.selectedSoIds().has(id);
  }

  toggleSalesOrder(order: SalesOrderForInvoiceDto): void {
    const ids = new Set(this.selectedSoIds());
    if (ids.has(order.salesOrderId)) {
      ids.delete(order.salesOrderId);
      this.lineItems.update((items) => items.filter((i) => i.salesOrderId !== order.salesOrderId));
    } else {
      ids.add(order.salesOrderId);
      const existing = new Set(this.lineItems().map((i) => i.salesOrderItemId));
      this.lineItems.update((items) => [
        ...items,
        ...order.items
          .filter((item) => !existing.has(item.salesOrderItemId))
          .map((item) => this.soItemToLineItem(item, order)),
      ]);
      if (this.formTaxPercentage() == null && order.taxPercentage != null)
        this.formTaxPercentage.set(order.taxPercentage);
    }
    this.selectedSoIds.set(ids);
    this.resetProductControls(this.lineItems());
  }

  private soItemToLineItem(
    item: SalesOrderItemForInvoiceDto,
    order: SalesOrderForInvoiceDto,
  ): InvoiceLineItem {
    return {
      productId: item.productId,
      productName: item.productName,
      unitShortName: item.unitShortName ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? undefined,
      availableStock: item.availableStock ?? undefined,
      salesOrderId: order.salesOrderId,
      salesOrderNumber: order.salesOrderNumber,
      salesOrderItemId: item.salesOrderItemId,
    };
  }

  applySoSelection(): void {
    this.showSoPanel.set(false);
  }

  addDirectLineItem(): void {
    this.lineItems.update((items) => [
      ...items,
      { productId: null, productName: '', unitShortName: '', quantity: 1 },
    ]);
    this.addProductControl();
  }

  removeLineItem(index: number): void {
    const item = this.lineItems()[index];
    if (
      item.salesOrderId &&
      this.lineItems().filter((li, i) => i !== index && li.salesOrderId === item.salesOrderId)
        .length === 0
    ) {
      const ids = new Set(this.selectedSoIds());
      ids.delete(item.salesOrderId);
      this.selectedSoIds.set(ids);
    }
    this.lineItems.update((items) => items.filter((_, i) => i !== index));
    this.productControls.splice(index, 1);
    this.filteredProductOptions.splice(index, 1);
  }

  updateProduct(index: number, productId: number | null): void {
    const product = this.productById(productId);
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index
          ? {
              ...item,
              productId,
              productName: product?.name ?? '',
              unitShortName: product?.unitShortName ?? '',
              unitPrice: product?.sellingPrice ?? undefined,
              availableStock: product?.stock ?? undefined,
            }
          : item,
      ),
    );
    this.productControls[index]?.setValue(product ?? '');
  }

  displayProduct(product: ProductDto | string | null): string {
    return typeof product === 'string' ? product : (product?.name ?? '');
  }
  onProductSelected(index: number, product: ProductDto): void {
    this.updateProduct(index, product.productId);
  }
  onProductInput(index: number, value: string): void {
    if (!value.trim()) this.updateProduct(index, null);
  }
  updateQuantity(index: number, quantity: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity || 1) } : item,
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
  productUnit(productId: number | null): string {
    return productId ? (this.productById(productId)?.unitShortName ?? '-') : '-';
  }
  productPrice(productId: number | null): string {
    return productId ? this.formatCurrency(this.productById(productId)?.sellingPrice) : '-';
  }
  stockLabel(line: InvoiceLineItem): string {
    return line.availableStock == null ? '-' : `${line.availableStock}`;
  }
  isOverStock(line: InvoiceLineItem): boolean {
    return line.availableStock != null && line.quantity > line.availableStock;
  }

  requestGenerateInvoice(): void {
    const validItems = this.lineItems().filter((i) => i.productId !== null);
    this.showConfirmModal.set(true);
  }

  confirmGenerateInvoice(): void {
    this.showConfirmModal.set(false);
    const validItems = this.lineItems().filter((i) => i.productId !== null);
    const dto: CreateSalesInvoiceDto = {
      customerId: this.customerId() ?? undefined,
      taxPercentage: this.formTaxPercentage() ?? undefined,
      remarks: this.formRemarks() || undefined,
      items: validItems.map((item) => ({
        productId: item.productId!,
        salesOrderId: item.salesOrderId ?? undefined,
        salesOrderItemId: item.salesOrderItemId ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? undefined,
      })),
    };
    this.saving.set(true);
    this.svc
      .create(dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (createRes) => {
          if (createRes.isSuccess) {
            this.svc.downloadPdf(createRes.data.salesInvoiceId);
            this.router.navigate(['/admin/sales/invoice']);
          }
        },
      });
  }

  cancelConfirm(): void {
    this.showConfirmModal.set(false);
  }
  cancel(): void {
    this.router.navigate(['/admin/sales/invoice']);
  }
  trackByIndex(index: number): number {
    return index;
  }

  selectedSoCount(): number {
    return this.selectedSoIds().size;
  }
  uniqueSosInInvoice(): Array<{ id: number; number: string }> {
    const map = new Map<number, string>();
    for (const item of this.lineItems())
      if (item.salesOrderId && item.salesOrderNumber)
        map.set(item.salesOrderId, item.salesOrderNumber);
    return Array.from(map.entries()).map(([id, number]) => ({ id, number }));
  }
  formatCurrency(val?: number | null): string {
    return val == null
      ? '-'
      : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private resetProductControls(items: InvoiceLineItem[]): void {
    this.productControls = [];
    this.filteredProductOptions = [];
    for (const item of items) this.addProductControl(this.productById(item.productId) ?? '');
  }
  private addProductControl(initialValue: ProductDto | string = ''): void {
    const control = new FormControl<ProductDto | string>(initialValue, { nonNullable: true });
    this.productControls.push(control);
    this.filteredProductOptions.push(
      control.valueChanges.pipe(
        startWith(initialValue),
        map((value) => this.filterProducts(value)),
      ),
    );
  }
  private filterProducts(value: ProductDto | string | null): ProductDto[] {
    const search = typeof value === 'string' ? value : (value?.name ?? '');
    return this.products().filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()),
    );
  }
  private productById(productId: number | null): ProductDto | undefined {
    return productId
      ? this.products().find((product) => product.productId === productId)
      : undefined;
  }

  private filterCustomers(value: CustomerDto | string | null): CustomerDto[] {
    const search = typeof value === 'string' ? value : (value?.name ?? '');
    return this.customers().filter((customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()),
    );
  }

  private customerById(customerId: number | null): CustomerDto | undefined {
    return customerId ? this.customers().find((c) => c.customerId === customerId) : undefined;
  }
}
