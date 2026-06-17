import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, finalize, forkJoin, map, startWith } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PurchaseRequisitionService } from '../../services/purchase-requisition.service';
import {
  ProductDto,
  RequisitionLineItem,
  SupplierDto,
} from '../../models/purchase-requisition.model';

@Component({
  selector: 'app-purchase-requisition-update',
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
  templateUrl: './purchase-requisition-update.html',
  styleUrl: './purchase-requisition-update.scss',
})
export class PurchaseRequisitionUpdate implements OnInit {
  private readonly svc = inject(PurchaseRequisitionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private requisitionId = 0;

  loading = signal(false);
  saving = signal(false);

  products = signal<ProductDto[]>([]);
  suppliers = signal<SupplierDto[]>([]);
  supplierId = signal<number | null>(null);
  supplierControl = new FormControl<SupplierDto | string>('', { nonNullable: true });
  filteredSuppliers$!: Observable<SupplierDto[]>;
  formRemarks = signal('');
  lineItems = signal<RequisitionLineItem[]>([]);
  requisitionNo = signal('');

  productControls: FormControl<ProductDto | string>[] = [];
  filteredProductOptions: Observable<ProductDto[]>[] = [];
  displayedColumns = ['product', 'unit', 'quantity', 'actions'];
  readonly validLineCount = computed(
    () => this.lineItems().filter((item) => item.productId != null).length,
  );
  readonly canSave = computed(() => this.supplierId() != null && this.validLineCount() > 0);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      return;
    }
    this.requisitionId = id;
    this.filteredSuppliers$ = this.supplierControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterSuppliers(value)),
    );

    this.loading.set(true);
    forkJoin({
      suppliers: this.svc.getSuppliers(),
      detail: this.svc.getById(this.requisitionId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.suppliers.isSuccess) this.suppliers.set(res.suppliers.data);
          if (res.detail.isSuccess) {
            const data = res.detail.data;
            this.requisitionNo.set(data.requisitionNo);
            this.formRemarks.set(data.remarks ?? '');
            this.supplierId.set(data.supplierId ?? null);
            this.supplierControl.setValue(this.supplierById(data.supplierId ?? null) ?? '');
            if (data.supplierId) {
              this.svc.getProducts(data.supplierId).subscribe({
                next: (productRes) => {
                  if (productRes.isSuccess) this.products.set(productRes.data);
                  const items = data.items.map((item) => ({
                    productId: item.productId,
                    productName: item.productName,
                    unitShortName: item.unitShortName ?? '',
                    quantity: item.quantity,
                  }));
                  this.lineItems.set(items);
                  this.resetProductControls(items);
                },
              });
            }
          }
        },
      });
  }

  displaySupplier(supplier: SupplierDto | string | null): string {
    return typeof supplier === 'string' ? supplier : (supplier?.name ?? '');
  }

  onSupplierSelected(supplier: SupplierDto): void {
    if (supplier.supplierId === this.supplierId()) return;
    this.supplierId.set(supplier.supplierId);
    this.products.set([]);
    this.lineItems.set([{ productId: null, productName: '', unitShortName: '', quantity: 1 }]);
    this.resetProductControls(this.lineItems());
    this.svc.getProducts(supplier.supplierId).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.products.set(res.data);
          this.resetProductControls(this.lineItems());
        }
      },
    });
  }

  onSupplierInput(value: string): void {
    if (value.trim()) return;
    this.supplierId.set(null);
    this.products.set([]);
    this.lineItems.set([{ productId: null, productName: '', unitShortName: '', quantity: 1 }]);
    this.resetProductControls(this.lineItems());
  }

  addLineItem(): void {
    this.lineItems.update((items) => [
      ...items,
      { productId: null, productName: '', unitShortName: '', quantity: 1 },
    ]);
    this.addProductControl();
  }

  removeLineItem(index: number): void {
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

  private resetProductControls(items: RequisitionLineItem[]): void {
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

  private supplierById(supplierId: number | null): SupplierDto | undefined {
    return supplierId
      ? this.suppliers().find((supplier) => supplier.supplierId === supplierId)
      : undefined;
  }

  private productById(productId: number | null): ProductDto | undefined {
    if (!productId) return undefined;
    return this.products().find((product) => product.productId === productId);
  }

  updateRequisition(): void {
    const validItems = this.lineItems().filter((item) => item.productId !== null);
    if (validItems.length === 0) {
      return;
    }

    this.saving.set(true);
    this.svc
      .update(this.requisitionId, {
        supplierId: this.supplierId() ?? undefined,
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
          }
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
