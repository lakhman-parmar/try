import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PurchaseRequisitionService } from '../../services/purchase-requisition.service';
import {
  ProductDto,
  RequisitionLineItem,
} from '../../models/purchase-requisition.model';

@Component({
  selector: 'app-purchase-requisition-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-requisition-update.html',
  styleUrl: './purchase-requisition-update.sass',
})
export class PurchaseRequisitionUpdate implements OnInit {
  private readonly svc = inject(PurchaseRequisitionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private requisitionId = 0;

  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  products = signal<ProductDto[]>([]);
  filteredProducts = signal<ProductDto[]>([]);
  productSearchTerm = signal('');
  dropdownOpenIndex = signal<number | null>(null);

  formRemarks = signal('');
  lineItems = signal<RequisitionLineItem[]>([
    { productId: null, productName: '', unitShortName: '', quantity: 1 },
  ]);

  requisitionNo = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMsg.set('Invalid requisition ID.');
      return;
    }
    this.requisitionId = id;
    this.loadProducts();
    this.loadRequisition();
  }

  private loadProducts(): void {
    this.svc.getProducts().subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.products.set(res.data);
        }
      },
    });
  }

  private loadRequisition(): void {
    this.loading.set(true);
    this.svc
      .getById(this.requisitionId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            const data = res.data;
            this.requisitionNo.set(data.requisitionNo);
            this.formRemarks.set(data.remarks ?? '');
            this.lineItems.set(
              data.items.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                unitShortName: item.unitShortName ?? '',
                quantity: item.quantity,
              })),
            );
          } else {
            this.errorMsg.set(res.message ?? 'Failed to load requisition.');
          }
        },
        error: () => this.errorMsg.set('Failed to load requisition details.'),
      });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeProductDropdown();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeProductDropdown();
  }

  addLineItem(): void {
    this.lineItems.update((items) => [
      ...items,
      { productId: null, productName: '', unitShortName: '', quantity: 1 },
    ]);
  }

  removeLineItem(index: number): void {
    this.lineItems.update((items) => items.filter((_, i) => i !== index));
  }

  updateQuantity(index: number, value: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, value) } : item)),
    );
  }

  openProductDropdown(index: number): void {
    this.dropdownOpenIndex.set(index);
    this.productSearchTerm.set('');
    this.filteredProducts.set(this.products());
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
            }
          : item,
      ),
    );
    this.closeProductDropdown();
  }

  isDropdownOpen(index: number): boolean {
    return this.dropdownOpenIndex() === index;
  }

  updateRequisition(): void {
    const validItems = this.lineItems().filter((item) => item.productId !== null);
    if (validItems.length === 0) {
      this.errorMsg.set('Add at least one product before updating.');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set(null);
    this.svc
      .update(this.requisitionId, {
        remarks: this.formRemarks() || undefined,
        items: validItems.map((item) => ({
          productId: item.productId!,
          quantity: item.quantity,
        })),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.router.navigate(['/admin/purchase/requisition']);
          } else {
            this.errorMsg.set(res.message ?? 'Failed to update requisition.');
          }
        },
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Failed to update requisition.');
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/purchase/requisition']);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
