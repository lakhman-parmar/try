import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ProductDetailDto, ProductSupplierDto, SupplierDto } from '../../models/product.model';

interface ApiResponse<T> {
  isSuccess: boolean;
  message?: string;
  data: T;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailModal implements OnInit {
  private readonly svc = inject(ProductService);

  productId = input.required<number>();
  productName = input<string>('');
  close = output<void>();

  loading = signal(false);
  detail = signal<ProductDetailDto | null>(null);
  suppliers = signal<SupplierDto[]>([]);
  savingMap = signal<Record<number, boolean>>({});
  deletingMap = signal<Record<number, boolean>>({});
  addingNew = signal(false);
  savingNew = signal(false);

  newSupplierId = signal<number | null>(null);
  newPurchasePrice = signal<number | null>(null);

  ngOnInit(): void {
    this.loadDetail();
    this.svc.getSuppliers().subscribe({
      next: (r: ApiResponse<SupplierDto[]>) => {
        if (r.isSuccess) this.suppliers.set(r.data);
      },
    });
  }

  private loadDetail(): void {
    this.loading.set(true);
    this.svc
      .getById(this.productId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r: ApiResponse<ProductDetailDto>) => {
          if (r.isSuccess) this.detail.set(r.data);
        },
      });
  }

  // Inline edit for each supplier row
  supplierPrices = signal<Record<number, number>>({});

  setPrice(mapping: ProductSupplierDto, value: number): void {
    this.supplierPrices.update((m) => ({ ...m, [mapping.supplierProductId]: value }));
  }

  getPrice(mapping: ProductSupplierDto): number {
    return this.supplierPrices()[mapping.supplierProductId] ?? mapping.purchasePrice ?? 0;
  }

  saveSupplierPrice(mapping: ProductSupplierDto): void {
    const price = this.getPrice(mapping);
    this.savingMap.update((m) => ({ ...m, [mapping.supplierProductId]: true }));
    this.svc
      .upsertSupplierProduct({
        productId: this.productId(),
        supplierId: mapping.supplierId,
        purchasePrice: price,
      })
      .pipe(
        finalize(() =>
          this.savingMap.update((m) => ({ ...m, [mapping.supplierProductId]: false })),
        ),
      )
      .subscribe({ next: () => this.loadDetail() });
  }

  removeSupplier(mapping: ProductSupplierDto): void {
    if (!confirm(`Remove ${mapping.supplierName} from this product?`)) return;
    this.deletingMap.update((m) => ({ ...m, [mapping.supplierProductId]: true }));
    this.svc
      .deleteSupplierProduct(mapping.supplierProductId)
      .pipe(
        finalize(() =>
          this.deletingMap.update((m) => ({ ...m, [mapping.supplierProductId]: false })),
        ),
      )
      .subscribe({ next: () => this.loadDetail() });
  }

  addSupplier(): void {
    const sid = this.newSupplierId();
    const price = this.newPurchasePrice();
    if (!sid || price == null) return;
    this.savingNew.set(true);
    this.svc
      .upsertSupplierProduct({ productId: this.productId(), supplierId: sid, purchasePrice: price })
      .pipe(finalize(() => this.savingNew.set(false)))
      .subscribe({
        next: () => {
          this.addingNew.set(false);
          this.newSupplierId.set(null);
          this.newPurchasePrice.set(null);
          this.loadDetail();
        },
      });
  }

  get availableSuppliers(): SupplierDto[] {
    const linked = new Set((this.detail()?.suppliers ?? []).map((s) => s.supplierId));
    return this.suppliers().filter((s) => !linked.has(s.supplierId));
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '—';
    return (
      '₹\u00A0' +
      val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) this.close.emit();
  }
}
