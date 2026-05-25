import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
import { ProductDto, RequisitionLineItem } from '../../models/purchase-requisition.model';

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
  errorMsg = signal<string | null>(null);

  products = signal<ProductDto[]>([]);
  formRemarks = signal('');
  lineItems = signal<RequisitionLineItem[]>([]);
  requisitionNo = signal('');

  productControls: FormControl<ProductDto | string>[] = [];
  filteredProductOptions: Observable<ProductDto[]>[] = [];
  displayedColumns = ['product', 'unit', 'quantity', 'actions'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMsg.set('Invalid requisition ID.');
      return;
    }
    this.requisitionId = id;

    this.loading.set(true);
    forkJoin({
      products: this.svc.getProducts(),
      detail: this.svc.getById(this.requisitionId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.products.isSuccess) {
            this.products.set(res.products.data);
          }
          if (res.detail.isSuccess) {
            const data = res.detail.data;
            this.requisitionNo.set(data.requisitionNo);
            this.formRemarks.set(data.remarks ?? '');
            const items = data.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              unitShortName: item.unitShortName ?? '',
              quantity: item.quantity,
            }));
            this.lineItems.set(items);
            this.resetProductControls(items);
          } else {
            this.errorMsg.set(res.detail.message ?? 'Failed to load requisition.');
          }
        },
        error: () => this.errorMsg.set('Failed to load requisition form.'),
      });
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

  private productById(productId: number | null): ProductDto | undefined {
    if (!productId) return undefined;
    return this.products().find((product) => product.productId === productId);
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
