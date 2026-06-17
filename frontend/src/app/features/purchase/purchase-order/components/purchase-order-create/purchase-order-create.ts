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
import { PurchaseOrderService } from '../../services/purchase-order.service';
import {
  PoLineItem,
  ProductDto,
  RequisitionForPoDto,
  RequisitionItemForPoDto,
  SupplierDto,
} from '../../models/purchase-order.model';

@Component({
  selector: 'app-purchase-order-create',
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
  templateUrl: './purchase-order-create.html',
  styleUrl: './purchase-order-create.scss',
})
export class PurchaseOrderCreate implements OnInit {
  private readonly svc = inject(PurchaseOrderService);
  private readonly router = inject(Router);

  saving = signal(false);
  loadingReqs = signal(false);
  loadingProducts = signal(false);

  // Infinite scroll for requisitions
  reqPage = signal(1);
  reqTotalPages = signal(1);
  reqLoading = signal(false);
  private reqPageSize = 20;

  // Data
  requisitions = signal<RequisitionForPoDto[]>([]);
  products = signal<ProductDto[]>([]);
  suppliers = signal<SupplierDto[]>([]);
  supplierId = signal<number | null>(null);
  supplierControl = new FormControl<SupplierDto | string>('', { nonNullable: true });
  filteredSuppliers$!: Observable<SupplierDto[]>;

  // Form state
  formRemarks = signal('');
  formTaxPercentage = signal<number | null>(null);

  // Requisition selection panel
  showReqPanel = signal(false);
  selectedReqIds = signal<Set<number>>(new Set());

  // Line items
  lineItems = signal<PoLineItem[]>([]);

  productControls: FormControl<ProductDto | string>[] = [];
  filteredProductOptions: Observable<ProductDto[]>[] = [];
  displayedColumns = ['product', 'unit', 'quantity', 'unitPrice', 'source', 'actions'];

  // Computed
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
    this.loadingReqs.set(true);
    this.reqPage.set(1);
    this.reqTotalPages.set(1);
    forkJoin({
      reqs: this.svc.getRequisitionsForPo(supplier.supplierId, 1, this.reqPageSize),
      products: this.svc.getProducts(supplier.supplierId),
    })
      .pipe(
        finalize(() => {
          this.loadingProducts.set(false);
          this.loadingReqs.set(false);
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.products.isSuccess) this.products.set(res.products.data);
          if (res.reqs.isSuccess) {
            this.requisitions.set(res.reqs.data.items);
            this.reqTotalPages.set(res.reqs.data.totalPages);
            this.reqPage.set(2);
          }
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
    this.requisitions.set([]);
    this.lineItems.set([]);
    this.selectedReqIds.set(new Set());
    this.showReqPanel.set(false);
    this.reqPage.set(1);
    this.reqTotalPages.set(1);
    this.reqLoading.set(false);
    this.resetProductControls([]);
  }

  // Requisition panel
  toggleReqPanel(): void {
    this.showReqPanel.update((v) => !v);
  }

  isReqSelected(id: number): boolean {
    return this.selectedReqIds().has(id);
  }

  toggleRequisition(req: RequisitionForPoDto): void {
    const ids = new Set(this.selectedReqIds());
    if (ids.has(req.purchaseRequisitionId)) {
      ids.delete(req.purchaseRequisitionId);
      this.lineItems.update((items) =>
        items.filter((i) => i.requisitionId !== req.purchaseRequisitionId),
      );
    } else {
      ids.add(req.purchaseRequisitionId);
      const existingProductIds = new Set(
        this.lineItems()
          .filter((i) => i.requisitionId === req.purchaseRequisitionId)
          .map((i) => i.productId),
      );
      const newItems: PoLineItem[] = req.items
        .filter((ri) => !existingProductIds.has(ri.productId))
        .map((ri) => this.reqItemToLineItem(ri, req));
      this.lineItems.update((items) => [...items, ...newItems]);
    }
    this.selectedReqIds.set(ids);
    this.resetProductControls(this.lineItems());
  }

  private reqItemToLineItem(ri: RequisitionItemForPoDto, req: RequisitionForPoDto): PoLineItem {
    const product = this.products().find((p) => p.productId === ri.productId);
    return {
      productId: ri.productId,
      productName: ri.productName,
      unitShortName: ri.unitShortName ?? '',
      quantity: ri.quantity,
      unitPrice: product?.purchasePrice ?? undefined,
      requisitionId: req.purchaseRequisitionId,
      requisitionNo: req.requisitionNo,
      requisitionItemId: ri.purchaseRequisitionItemId,
    };
  }

  applyRequisitions(): void {
    this.showReqPanel.set(false);
  }

  onReqScroll(event: Event): void {
    if (this.reqLoading()) return;
    if (this.reqPage() > this.reqTotalPages()) return;

    const el = event.target as HTMLElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (!atBottom) return;

    this.reqLoading.set(true);
    const supplierId = this.supplierId();
    if (!supplierId) return;

    this.svc
      .getRequisitionsForPo(supplierId, this.reqPage(), this.reqPageSize)
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.requisitions.update((prev) => [...prev, ...res.data.items]);
            this.reqPage.update((p) => p + 1);
          }
        },
        complete: () => this.reqLoading.set(false),
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
    if (item.requisitionId) {
      const remaining = this.lineItems().filter(
        (li, i) => i !== index && li.requisitionId === item.requisitionId,
      );
      if (remaining.length === 0) {
        const ids = new Set(this.selectedReqIds());
        ids.delete(item.requisitionId);
        this.selectedReqIds.set(ids);
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

  private resetProductControls(items: PoLineItem[]): void {
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
  submit(): void {
    const validItems = this.lineItems().filter((item) => item.productId !== null);
    if (validItems.length === 0) {
      return;
    }

    this.saving.set(true);

    this.svc
      .create({
        supplierId: this.supplierId() ?? undefined,
        remarks: this.formRemarks() || undefined,
        taxPercentage: this.formTaxPercentage() ?? undefined,
        items: validItems.map((item) => ({
          productId: item.productId!,
          requisitionId: item.requisitionId ?? undefined,
          requisitionItemId: item.requisitionItemId ?? undefined,
          quantity: item.quantity,
        })),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.router.navigate(['/admin/purchase/order']);
          }
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/purchase/order']);
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '—';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
