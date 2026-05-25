import { Component, inject, OnInit, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { PurchaseBillService } from '../../services/purchase-bill.sevice';
import {
  PurchaseOrderForBillDto,
  PurchaseOrderItemForBillDto,
  BillLineItem,
  ProductDto,
  CreatePurchaseBillDto,
} from '../../models/purchase-bill.model';
import { downloadPurchaseBillPdf } from '../../utils/purchase-bill-pdf.util';

@Component({
  selector: 'app-purchase-bill-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-bill-create.html',
  styleUrl: './purchase-bill-create.scss',
})
export class PurchaseBillCreate implements OnInit {
  private readonly svc = inject(PurchaseBillService);
  private readonly router = inject(Router);

  saving = signal(false);
  errorMsg = signal<string | null>(null);

  formTaxPercentage = signal<number | null>(null);
  formRemarks = signal('');

  // ── Orders for bill (PO selection) ────────────────────────────────────────────
  ordersForBill = signal<PurchaseOrderForBillDto[]>([]);
  loadingOrders = signal(false);
  selectedPoIds = signal<Set<number>>(new Set());
  showPoPanel = signal(false);

  // ── Line items ────────────────────────────────────────────────────────────────
  lineItems = signal<BillLineItem[]>([]);

  // ── Products (for extra rows) ──────────────────────────────────────────────────
  products = signal<ProductDto[]>([]);
  filteredProducts = signal<ProductDto[]>([]);
  loadingProducts = signal(false);

  // ── Product dropdown ──────────────────────────────────────────────────────────
  productSearchTerm = signal('');
  dropdownOpenIndex = signal<number | null>(null);

  // ── Confirmation modal ────────────────────────────────────────────────────────
  showConfirmModal = signal(false);

  // ── Computed totals ───────────────────────────────────────────────────────────
  readonly subTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
  );

  readonly taxAmount = computed(() => {
    const tax = this.formTaxPercentage();
    return tax ? (this.subTotal() * tax) / 100 : 0;
  });

  readonly grandTotal = computed(() => this.subTotal() + this.taxAmount());

  ngOnInit(): void {
    this.loadOrdersForBill();
    this.loadProducts();
  }

  // ── Data loading ────────────────────────────────────────────────────────────
  private loadOrdersForBill(): void {
    this.loadingOrders.set(true);
    this.svc
      .getOrdersForBill()
      .pipe(finalize(() => this.loadingOrders.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.ordersForBill.set(res.data);
        },
      });
  }

  private loadProducts(): void {
    this.loadingProducts.set(true);
    this.svc
      .getProducts()
      .pipe(finalize(() => this.loadingProducts.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.products.set(res.data);
            this.filteredProducts.set(res.data);
          }
        },
      });
  }

  // ── PO selection panel ──────────────────────────────────────────────────────
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
  }

  applyPoSelection(): void {
    this.showPoPanel.set(false);
  }

  // ── Direct line items ───────────────────────────────────────────────────────
  addDirectLineItem(): void {
    this.lineItems.update((items) => [
      ...items,
      { productId: null, productName: '', unitShortName: '', quantity: 1 },
    ]);
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
  }

  updateQuantity(index: number, value: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, quantity: Math.max(0.01, value) } : item)),
    );
  }

  // ── Product dropdown ────────────────────────────────────────────────────────
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
    this.filteredProducts.set(this.products().filter((p) => p.name.toLowerCase().includes(lower)));
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
    if (this.showPoPanel()) this.showPoPanel.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeProductDropdown();
    this.showPoPanel.set(false);
    this.showConfirmModal.set(false);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  requestGenerateBill(): void {
    const validItems = this.lineItems().filter((i) => i.productId !== null);
    if (validItems.length === 0) {
      this.errorMsg.set('Add at least one product before generating.');
      return;
    }
    this.errorMsg.set(null);
    this.showConfirmModal.set(true);
  }

  confirmGenerateBill(): void {
    this.showConfirmModal.set(false);
    const validItems = this.lineItems().filter((i) => i.productId !== null);
    const dto: CreatePurchaseBillDto = {
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
      .pipe(
        switchMap((createRes) => {
          if (!createRes.isSuccess) {
            throw new Error(createRes.message ?? 'Failed to generate purchase bill.');
          }
          // Stock is now updated in DB. Fetch full detail to build the PDF.
          return this.svc.getById(createRes.data.purchaseBillId);
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: async (detailRes) => {
          if (detailRes.isSuccess) {
            // Download PDF first, then navigate after print dialog closes.
            await downloadPurchaseBillPdf(detailRes.data);
            this.router.navigate(['/admin/purchase/bill']);
          } else {
            this.errorMsg.set(detailRes.message ?? 'Failed to load bill for PDF generation.');
          }
        },
        error: (err) => {
          this.errorMsg.set(
            err?.message ?? err?.error?.message ?? 'Failed to generate purchase bill.',
          );
        },
      });
  }

  cancelConfirm(): void {
    this.showConfirmModal.set(false);
  }

  cancel(): void {
    this.router.navigate(['/admin/purchase/bill']);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
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
    if (val == null) return '\u2014';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
