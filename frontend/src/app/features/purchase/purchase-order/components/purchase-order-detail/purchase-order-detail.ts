import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  PurchaseOrderDetailDto,
  RequisitionForPoDto,
  RequisitionItemForPoDto,
} from '../../models/purchase-order.model';

@Component({
  selector: 'app-purchase-order-detail',
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
  templateUrl: './purchase-order-detail.html',
  styleUrl: './purchase-order-detail.scss',
})
export class PurchaseOrderDetail implements OnInit {
  private readonly svc = inject(PurchaseOrderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private orderId = 0;

  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  order = signal<PurchaseOrderDetailDto | null>(null);
  requisitions = signal<RequisitionForPoDto[]>([]);
  products = signal<ProductDto[]>([]);

  // ── Form state ──────────────────────────────────────────────────────────────
  formRemarks = signal('');
  formTaxPercentage = signal<number | null>(null);

  // ── Requisition panel ────────────────────────────────────────────────────────
  showReqPanel = signal(false);
  selectedReqIds = signal<Set<number>>(new Set());

  // ── Line items ───────────────────────────────────────────────────────────────
  lineItems = signal<PoLineItem[]>([]);

  productControls: FormControl<ProductDto | string>[] = [];
  filteredProductOptions: Observable<ProductDto[]>[] = [];
  displayedColumns = ['product', 'unit', 'quantity', 'unitPrice', 'source', 'actions'];

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly subTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
  );
  readonly taxAmount = computed(() => {
    const tax = this.formTaxPercentage();
    return tax ? (this.subTotal() * tax) / 100 : 0;
  });
  readonly grandTotal = computed(() => this.subTotal() + this.taxAmount());

  readonly validLineCount = computed(() => this.lineItems().filter((item) => item.productId).length);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMsg.set('Invalid order ID.');
      return;
    }
    this.orderId = id;

    this.loading.set(true);
    forkJoin({
      order: this.svc.getById(this.orderId),
      reqs: this.svc.getRequisitionsForPo(),
      products: this.svc.getProducts(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.reqs.isSuccess) this.requisitions.set(res.reqs.data);
          if (res.products.isSuccess) this.products.set(res.products.data);

          if (res.order.isSuccess) {
            const o = res.order.data;
            this.order.set(o);
            this.formRemarks.set(o.remarks ?? '');
            this.formTaxPercentage.set(o.taxPercentage ?? null);

            // Seed line items
            const items: PoLineItem[] = o.items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              unitShortName: i.unitShortName ?? '',
              quantity: i.quantity,
              unitPrice: i.unitPrice ?? undefined,
              requisitionId: i.requisitionId ?? undefined,
              requisitionNo: i.requisitionNo ?? undefined,
              requisitionItemId: i.requisitionItemId ?? undefined,
            }));
            this.lineItems.set(items);

            // Seed selected requisition IDs
            const reqIds = new Set<number>(
              items.filter((i) => i.requisitionId != null).map((i) => i.requisitionId!),
            );
            this.selectedReqIds.set(reqIds);

            this.resetProductControls(items);
          } else {
            this.errorMsg.set(res.order.message ?? 'Failed to load purchase order.');
          }
        },
        error: () => this.errorMsg.set('Failed to load purchase order details.'),
      });
  }

  // ── Requisition panel ────────────────────────────────────────────────────────
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

  // ── Direct line items ────────────────────────────────────────────────────────
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
        ids.delete(item.requisitionId!);
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

  private productById(productId: number | null): ProductDto | undefined {
    if (!productId) return undefined;
    return this.products().find((product) => product.productId === productId);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  submit(): void {
    const validItems = this.lineItems().filter((item) => item.productId !== null);
    if (validItems.length === 0) {
      this.errorMsg.set('Add at least one product before saving.');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set(null);

    this.svc
      .update(this.orderId, {
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
          } else {
            this.errorMsg.set(res.message ?? 'Failed to update purchase order.');
          }
        },
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Failed to update purchase order.');
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

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
