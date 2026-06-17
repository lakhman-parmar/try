import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, finalize, forkJoin, map, startWith } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PurchaseBillService } from '../../services/purchase-bill.sevice';
import {
  PurchaseOrderForBillDto,
  PurchaseOrderItemForBillDto,
  BillLineItem,
  ProductDto,
  CreatePurchaseBillDto,
  SupplierDto,
} from '../../models/purchase-bill.model';


@Component({
  selector: 'app-purchase-bill-create',
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
  templateUrl: './purchase-bill-create.html',
  styleUrl: './purchase-bill-create.scss',
})
export class PurchaseBillCreate implements OnInit {
  private readonly svc = inject(PurchaseBillService);
  private readonly router = inject(Router);

  saving = signal(false);

  formTaxPercentage = signal<number | null>(null);
  formRemarks = signal('');
  suppliers = signal<SupplierDto[]>([]);
  supplierId = signal<number | null>(null);
  supplierControl = new FormControl<SupplierDto | string>('', { nonNullable: true });
  filteredSuppliers$!: Observable<SupplierDto[]>;

  // Infinite scroll for purchase orders
  poPage = signal(1);
  poTotalPages = signal(1);
  poLoading = signal(false);
  private poPageSize = 20;

  // Orders for bill (PO selection)
  ordersForBill = signal<PurchaseOrderForBillDto[]>([]);
  loadingOrders = signal(false);
  selectedPoIds = signal<Set<number>>(new Set());
  showPoPanel = signal(false);

  // Line items
  lineItems = signal<BillLineItem[]>([]);

  // Products (for extra rows)
  products = signal<ProductDto[]>([]);
  loadingProducts = signal(false);

  productControls: FormControl<ProductDto | string>[] = [];
  filteredProductOptions: Observable<ProductDto[]>[] = [];
  displayedColumns = ['product', 'unit', 'quantity', 'unitPrice', 'source', 'actions'];

  // Confirmation modal
  showConfirmModal = signal(false);

  // Computed totals
  readonly subTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
  );

  readonly taxAmount = computed(() => {
    const tax = this.formTaxPercentage();
    return tax ? (this.subTotal() * tax) / 100 : 0;
  });

  readonly grandTotal = computed(() => this.subTotal() + this.taxAmount());

  readonly validLineCount = computed(
    () => this.lineItems().filter((item) => item.productId).length,
  );
  readonly canSave = computed(() => this.supplierId() != null && this.validLineCount() > 0);

  ngOnInit(): void {
    this.filteredSuppliers$ = this.supplierControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterSuppliers(value)),
    );
    this.svc.getSuppliers().subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.suppliers.set(res.data);
          this.supplierControl.setValue(this.supplierControl.value);
        }
      },
    });
  }

  displaySupplier(supplier: SupplierDto | string | null): string {
    return typeof supplier === 'string' ? supplier : (supplier?.name ?? '');
  }

  onSupplierSelected(supplier: SupplierDto): void {
    this.supplierId.set(supplier.supplierId);
    this.clearSupplierData();
    this.loadingProducts.set(true);
    this.loadingOrders.set(true);
    this.poPage.set(1);
    this.poTotalPages.set(1);
    forkJoin({
      pos: this.svc.getOrdersForBill(supplier.supplierId, 1, this.poPageSize),
      products: this.svc.getProducts(supplier.supplierId),
    })
      .pipe(
        finalize(() => {
          this.loadingProducts.set(false);
          this.loadingOrders.set(false);
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.pos.isSuccess) {
            this.ordersForBill.set(res.pos.data.items);
            this.poTotalPages.set(res.pos.data.totalPages);
            this.poPage.set(2);
          }
          if (res.products.isSuccess) this.products.set(res.products.data);
          this.addDirectLineItem();
        },
      });
  }

  onSupplierInput(value: string): void {
    if (value.trim()) return;
    this.supplierId.set(null);
    this.clearSupplierData();
  }

  private clearSupplierData(): void {
    this.products.set([]);
    this.ordersForBill.set([]);
    this.lineItems.set([]);
    this.selectedPoIds.set(new Set());
    this.showPoPanel.set(false);
    this.poPage.set(1);
    this.poTotalPages.set(1);
    this.poLoading.set(false);
    this.resetProductControls([]);
  }

  // PO selection panel
  togglePoPanel(): void {
    this.showPoPanel.update((v) => !v);
  }

  isPoSelected(id: number): boolean {
    return this.selectedPoIds().has(id);
  }

  togglePurchaseOrder(po: PurchaseOrderForBillDto): void {
    const ids = new Set(this.selectedPoIds());
    if (ids.has(po.purchaseOrderId)) {
      ids.delete(po.purchaseOrderId);
      this.lineItems.update((items) =>
        items.filter((i) => i.purchaseOrderId !== po.purchaseOrderId),
      );
    } else {
      ids.add(po.purchaseOrderId);
      const existingPoItemIds = new Set(
        this.lineItems()
          .filter((i) => i.purchaseOrderId === po.purchaseOrderId)
          .map((i) => i.purchaseOrderItemId),
      );
      const newItems: BillLineItem[] = po.items
        .filter((item) => !existingPoItemIds.has(item.purchaseOrderItemId))
        .map((item) => this.poItemToLineItem(item, po));
      this.lineItems.update((items) => [...items, ...newItems]);
    }
    this.selectedPoIds.set(ids);
    this.resetProductControls(this.lineItems());
  }

  private poItemToLineItem(
    item: PurchaseOrderItemForBillDto,
    po: PurchaseOrderForBillDto,
  ): BillLineItem {
    return {
      productId: item.productId,
      productName: item.productName,
      unitShortName: item.unitShortName ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? undefined,
      purchaseOrderId: po.purchaseOrderId,
      poNumber: po.poNumber,
      purchaseOrderItemId: item.purchaseOrderItemId,
      requisitionId: item.requisitionId ?? undefined,
      requisitionNo: item.requisitionNo ?? undefined,
      requisitionItemId: item.requisitionItemId ?? undefined,
    };
  }

  removePoFromBill(poId: number): void {
    const ids = new Set(this.selectedPoIds());
    ids.delete(poId);
    this.selectedPoIds.set(ids);
    this.lineItems.update((items) => items.filter((i) => i.purchaseOrderId !== poId));
    this.resetProductControls(this.lineItems());
  }

  applyPoSelection(): void {
    this.showPoPanel.set(false);
  }

  onPoScroll(event: Event): void {
    if (this.poLoading()) return;
    if (this.poPage() > this.poTotalPages()) return;

    const el = event.target as HTMLElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (!atBottom) return;

    this.poLoading.set(true);
    const supplierId = this.supplierId();
    if (!supplierId) return;

    this.svc
      .getOrdersForBill(supplierId, this.poPage(), this.poPageSize)
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.ordersForBill.update((prev) => [...prev, ...res.data.items]);
            this.poPage.update((p) => p + 1);
          }
        },
        complete: () => this.poLoading.set(false),
      });
  }

  // Direct line items
  addDirectLineItem(): void {
    this.lineItems.update((items) => [
      ...items,
      { productId: null, productName: '', unitShortName: '', quantity: 1 },
    ]);
    this.addProductControl();
  }

  removeLineItem(index: number): void {
    const item = this.lineItems()[index];
    if (item.purchaseOrderId) {
      const remaining = this.lineItems().filter(
        (li, i) => i !== index && li.purchaseOrderId === item.purchaseOrderId,
      );
      if (remaining.length === 0) {
        const ids = new Set(this.selectedPoIds());
        ids.delete(item.purchaseOrderId!);
        this.selectedPoIds.set(ids);
      }
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
              unitPrice: product?.purchasePrice ?? undefined,
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
    if (value.trim()) return;
    this.updateProduct(index, null);
  }

  updateQuantity(index: number, quantity: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity || 1) } : item,
      ),
    );
  }

  adjustQuantity(index: number, delta: number): void {
    const currentQuantity = this.lineItems()[index]?.quantity ?? 1;
    this.updateQuantity(index, currentQuantity + delta);
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
    if (!productId) return '-';
    return this.products().find((product) => product.productId === productId)?.unitShortName ?? '-';
  }

  productPrice(productId: number | null): string {
    if (!productId) return '-';
    const val = this.products().find((product) => product.productId === productId)?.purchasePrice;
    if (val == null) return '-';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private resetProductControls(items: BillLineItem[]): void {
    this.productControls = [];
    this.filteredProductOptions = [];
    for (const item of items) {
      this.addProductControl(this.productById(item.productId) ?? '');
    }
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
    const filterValue = search.toLowerCase();
    return this.products().filter((product) => product.name.toLowerCase().includes(filterValue));
  }

  private filterSuppliers(value: SupplierDto | string | null): SupplierDto[] {
    const search = typeof value === 'string' ? value : (value?.name ?? '');
    const filterValue = search.toLowerCase();
    return this.suppliers().filter((supplier) => supplier.name.toLowerCase().includes(filterValue));
  }

  private productById(productId: number | null): ProductDto | undefined {
    if (!productId) return undefined;
    return this.products().find((product) => product.productId === productId);
  }

  // Submit
  requestGenerateBill(): void {
    const validItems = this.lineItems().filter((i) => i.productId !== null);
    if (validItems.length === 0) {
      return;
    }
    this.showConfirmModal.set(true);
  }

  confirmGenerateBill(): void {
    this.showConfirmModal.set(false);
    const validItems = this.lineItems().filter((i) => i.productId !== null);
    const dto: CreatePurchaseBillDto = {
      supplierId: this.supplierId() ?? undefined,
      taxPercentage: this.formTaxPercentage() ?? undefined,
      remarks: this.formRemarks() || undefined,
      items: validItems.map((item) => ({
        productId: item.productId!,
        purchaseOrderId: item.purchaseOrderId ?? undefined,
        purchaseOrderItemId: item.purchaseOrderItemId ?? undefined,
        quantity: item.quantity,
      })),
    };

    this.saving.set(true);
    this.svc
      .create(dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (createRes) => {
          if (createRes.isSuccess) {
            this.svc.downloadPdf(createRes.data.purchaseBillId);
            this.router.navigate(['/admin/purchase/bill']);
          }
        },
      });
  }

  cancelConfirm(): void {
    this.showConfirmModal.set(false);
  }

  cancel(): void {
    this.router.navigate(['/admin/purchase/bill']);
  }

  // Helpers
  trackByIndex(index: number): number {
    return index;
  }

  selectedPoCount(): number {
    return this.selectedPoIds().size;
  }

  uniquePosInBill(): Array<{ id: number; number: string }> {
    const map = new Map<number, string>();
    for (const item of this.lineItems()) {
      if (item.purchaseOrderId && item.poNumber) {
        map.set(item.purchaseOrderId, item.poNumber);
      }
    }
    return Array.from(map.entries()).map(([id, number]) => ({ id, number }));
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '—';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
