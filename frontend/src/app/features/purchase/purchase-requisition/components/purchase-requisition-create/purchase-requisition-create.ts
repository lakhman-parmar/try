import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { PurchaseRequisitionService } from '../../services/purchase-requisition.service';
import {
  ProductDto,
  RequisitionLineItem,
} from '../../models/purchase-requisition.model';

@Component({
  selector: 'app-purchase-requisition-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-requisition-create.html',
  styleUrl: './purchase-requisition-create.scss',
})
export class PurchaseRequisitionCreate implements OnInit {
  private readonly svc = inject(PurchaseRequisitionService);
  private readonly router = inject(Router);

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

  ngOnInit(): void {
    this.loadProducts();
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
            }
          : item,
      ),
    );
    this.closeProductDropdown();
  }

  isDropdownOpen(index: number): boolean {
    return this.dropdownOpenIndex() === index;
  }

  submitRequisition(): void {
    const validItems = this.lineItems().filter((item) => item.productId !== null);
    if (validItems.length === 0) {
      this.errorMsg.set('Add at least one product before submitting.');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set(null);
    this.svc
      .create({
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
            this.errorMsg.set(res.message ?? 'Failed to create requisition.');
          }
        },
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Failed to create requisition.');
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
