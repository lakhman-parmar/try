import { Component, inject, OnInit, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
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
  imports: [CommonModule, FormsModule],
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
  filteredProducts = signal<ProductDto[]>([]);

  // ── Form state ──────────────────────────────────────────────────────────────
  formRemarks = signal('');
  formTaxPercentage = signal<number | null>(null);

  // ── Requisition panel ────────────────────────────────────────────────────────
  showReqPanel = signal(false);
  selectedReqIds = signal<Set<number>>(new Set());

  // ── Line items ───────────────────────────────────────────────────────────────
  lineItems = signal<PoLineItem[]>([]);

  // ── Product dropdown ─────────────────────────────────────────────────────────
  productSearchTerm = signal('');
  dropdownOpenIndex = signal<number | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly subTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
  );
  readonly taxAmount = computed(() => {
    const tax = this.formTaxPercentage();
    return tax ? (this.subTotal() * tax) / 100 : 0;
  });
  readonly grandTotal = computed(() => this.subTotal() + this.taxAmount());

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMsg.set('Invalid order ID.');
      return;
    }
    this.orderId = id;
    this.loadOrder();
    this.loadRequisitions();
    this.loadProducts();
  }

  private loadOrder(): void {
    this.loading.set(true);
    this.svc
      .getById(this.orderId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            const o = res.data;
            this.order.set(o);
            this.formRemarks.set(o.remarks ?? '');
            this.formTaxPercentage.set(o.taxPercentage ?? null);

            // Seed line items from existing order items
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
          }
        },
        error: () => this.errorMsg.set('Failed to load purchase order.'),
      });
  }

  private loadRequisitions(): void {
    this.svc.getRequisitionsForPo().subscribe({
      next: (res) => {
        if (res.isSuccess) this.requisitions.set(res.data);
      },
    });
  }

  private loadProducts(): void {
    this.svc.getProducts().subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.products.set(res.data);
          this.filteredProducts.set(res.data);
        }
      },
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
  }

  updateQuantity(index: number, value: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, value) } : item,
      ),
    );
  }

  // ── Product dropdown ─────────────────────────────────────────────────────────
  openProductDropdown(index: number, event: Event): void {
    event.stopPropagation();
    if (this.dropdownOpenIndex() === index) {
      this.closeProductDropdown();
    } else {
      this.dropdownOpenIndex.set(index);
      this.productSearchTerm.set('');
      this.filteredProducts.set(this.products());
    }
  }

  closeProductDropdown(): void {
    this.dropdownOpenIndex.set(null);
    this.productSearchTerm.set('');
  }

  filterProducts(term: string): void {
    this.productSearchTerm.set(term);
    const lower = term.toLowerCase();
    this.filteredProducts.set(
      this.products().filter((p) => p.name.toLowerCase().includes(lower)),
    );
  }

  selectProduct(index: number, product: ProductDto): void {
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: product.productId,
              productName: product.name,
              unitShortName: product.unitShortName ?? '',
              unitPrice: product.purchasePrice ?? undefined,
            }
          : item,
      ),
    );
    this.closeProductDropdown();
  }

  isDropdownOpen(index: number): boolean {
    return this.dropdownOpenIndex() === index;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeProductDropdown();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeProductDropdown();
    this.showReqPanel.set(false);
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
