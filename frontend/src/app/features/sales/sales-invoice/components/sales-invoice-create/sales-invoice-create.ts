import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, map, Observable, startWith, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SalesInvoiceService } from '../../services/sales-invoice.service';
import {
  CreateSalesInvoiceDto,
  InvoiceLineItem,
  ProductDto,
  SalesOrderForInvoiceDto,
  SalesOrderItemForInvoiceDto,
} from '../../models/sales-invoice.model';
import { downloadSalesInvoicePdf } from '../../utils/sales-invoice-pdf.util';
import { getApiErrorMessage } from '../../utils/error-message.util';

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
  errorMsg = signal<string | null>(null);
  formTaxPercentage = signal<number | null>(null);
  formRemarks = signal('');
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

  ngOnInit(): void {
    this.loadingProducts.set(true);
    this.loadingOrders.set(true);
    forkJoin({ orders: this.svc.getOrdersForInvoice(), products: this.svc.getProducts() })
      .pipe(
        finalize(() => {
          this.loadingProducts.set(false);
          this.loadingOrders.set(false);
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.orders.isSuccess) this.ordersForInvoice.set(res.orders.data);
          if (res.products.isSuccess) this.products.set(res.products.data);
          this.addDirectLineItem();
        },
        error: (err) =>
          this.errorMsg.set(getApiErrorMessage(err, 'Failed to load sales order or product data.')),
      });
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
    const validationError = this.getValidationError(validItems);
    if (validationError) {
      this.errorMsg.set(validationError);
      return;
    }
    this.errorMsg.set(null);
    this.showConfirmModal.set(true);
  }

  confirmGenerateInvoice(): void {
    this.showConfirmModal.set(false);
    const validItems = this.lineItems().filter((i) => i.productId !== null);
    const firstOrder = this.ordersForInvoice().find((order) =>
      this.selectedSoIds().has(order.salesOrderId),
    );
    const dto: CreateSalesInvoiceDto = {
      customerId: firstOrder?.customerId,
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
      .pipe(
        switchMap((createRes) => {
          if (!createRes.isSuccess) {
            throw new Error(createRes.message ?? 'Failed to create sales invoice.');
          }
          return this.svc.getById(createRes.data.salesInvoiceId);
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (detailRes) => {
          if (detailRes.isSuccess) {
            downloadSalesInvoicePdf(detailRes.data);
            this.router.navigate(['/admin/sales/invoice']);
          } else {
            this.errorMsg.set(detailRes.message ?? 'Failed to load invoice for PDF generation.');
          }
        },
        error: (err) =>
          this.errorMsg.set(getApiErrorMessage(err, 'Failed to create sales invoice.')),
      });
  }

  cancelConfirm(): void {
    this.showConfirmModal.set(false);
  }
  cancel(): void {
    this.router.navigate(['/admin/sales/invoice']);
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

  private getValidationError(items: InvoiceLineItem[]): string | null {
    if (this.formRemarks().length > 1000) return 'Remarks cannot exceed 1000 characters.';
    const tax = this.formTaxPercentage();
    if (tax != null && (tax < 0 || tax > 100)) return 'Tax percentage must be between 0 and 100.';
    if (items.length === 0) return 'Add at least one product before creating an invoice.';
    if (items.length > 100) return 'A sales invoice cannot contain more than 100 items.';
    if (items.some((item) => item.quantity <= 0)) return 'Quantity must be greater than zero.';
    if (items.some((item) => item.quantity > 999999)) return 'Quantity is too large.';
    if (items.some((item) => this.isOverStock(item))) {
      return 'One or more invoice items exceed available stock.';
    }
    const orderItemIds = items
      .map((item) => item.salesOrderItemId)
      .filter((id): id is number => id != null);
    if (new Set(orderItemIds).size !== orderItemIds.length) {
      return 'A sales order item cannot be added more than once.';
    }
    return null;
  }
}
