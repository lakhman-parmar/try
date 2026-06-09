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
import {
  CustomerDto,
  EstimationForSoDto,
  ProductDto,
  SalesOrderDetailDto,
  SoLineItem,
} from '../../models/sales-order.model';
import { SalesOrderService } from '../../services/sales-order.service';

@Component({
  selector: 'app-sales-order-form',
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
  templateUrl: './sales-order-form.html',
  styleUrl: './sales-order-form.scss',
})
export class SalesOrderForm implements OnInit {
  private readonly svc = inject(SalesOrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = Number.isFinite(this.id) && this.id > 0;
  readonly title = this.isEdit ? 'Edit Sales Order' : 'New Sales Order';
  readonly displayedColumns = ['product', 'unit', 'quantity', 'unitPrice', 'source', 'actions'];

  loading = signal(false);
  saving = signal(false);
  customers = signal<CustomerDto[]>([]);
  products = signal<ProductDto[]>([]);
  estimations = signal<EstimationForSoDto[]>([]);
  customerId = signal<number | null>(null);
  customerControl = new FormControl<CustomerDto | string>('', { nonNullable: true });
  filteredCustomers$!: Observable<CustomerDto[]>;
  remarks = signal('');
  taxPercentage = signal<number | null>(null);
  lineItems = signal<SoLineItem[]>([]);
  productControls: FormControl<ProductDto | string>[] = [];
  filteredProductOptions: Observable<ProductDto[]>[] = [];
  selectedEstimationIds = signal<Set<number>>(new Set());
  showEstimationPanel = signal(false);

  subTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 0), 0),
  );
  taxAmount = computed(() => {
    const tax = this.taxPercentage();
    return tax ? (this.subTotal() * tax) / 100 : 0;
  });
  grandTotal = computed(() => this.subTotal() + this.taxAmount());

  validLineCount = computed(() => this.lineItems().filter((item) => item.productId).length);

  ngOnInit(): void {
    this.loading.set(true);
    this.filteredCustomers$ = this.customerControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterCustomers(value)),
    );

    if (this.isEdit) {
      forkJoin({
        products: this.svc.getProducts(),
        customers: this.svc.getCustomers(),
        estimations: this.svc.getEstimationsForSo(),
        detail: this.svc.getById(this.id),
      })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.products.isSuccess) this.products.set(res.products.data);
            if (res.customers.isSuccess) this.customers.set(res.customers.data);
            if (res.estimations.isSuccess) this.estimations.set(res.estimations.data);
            this.customerControl.setValue(this.customerControl.value ?? '');

            if (res.detail.isSuccess) {
              this.seedFromDetail(res.detail.data);
            }
          },
          error: () => {},
        });
      return;
    }

    forkJoin({
      products: this.svc.getProducts(),
      customers: this.svc.getCustomers(),
      estimations: this.svc.getEstimationsForSo(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.products.isSuccess) this.products.set(res.products.data);
          if (res.customers.isSuccess) this.customers.set(res.customers.data);
          if (res.estimations.isSuccess) this.estimations.set(res.estimations.data);
          this.customerControl.setValue(this.customerControl.value ?? '');
          if (this.lineItems().length === 0) this.addLineItem();
        },
      });
  }

  private seedFromDetail(detail: SalesOrderDetailDto): void {
    this.customerId.set(detail.customerId ?? null);
    this.customerControl.setValue(this.customerById(detail.customerId ?? null) ?? '');
    this.remarks.set(detail.remarks ?? '');
    this.taxPercentage.set(detail.taxPercentage ?? null);

    const items = detail.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitShortName: item.unitShortName ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? undefined,
      estimationId: item.estimationId ?? undefined,
      estimationNumber: item.estimationNumber ?? undefined,
      estimationItemId: item.estimationItemId ?? undefined,
    }));
    this.lineItems.set(items);
    this.resetProductControls(items);

    const estimateIds = new Set<number>(
      items.filter((i) => i.estimationId != null).map((i) => i.estimationId!),
    );
    this.selectedEstimationIds.set(estimateIds);
  }

  addLineItem(): void {
    this.lineItems.update((items) => [
      ...items,
      { productId: null, productName: '', unitShortName: '', quantity: 1 },
    ]);
    this.addProductControl();
  }

  removeLineItem(index: number): void {
    const item = this.lineItems()[index];
    if (item.estimationId) {
      const remaining = this.lineItems().filter(
        (li, i) => i !== index && li.estimationId === item.estimationId,
      );
      if (remaining.length === 0) {
        const ids = new Set(this.selectedEstimationIds());
        ids.delete(item.estimationId);
        this.selectedEstimationIds.set(ids);
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
              unitPrice: product?.sellingPrice ?? undefined,
            }
          : item,
      ),
    );
    this.productControls[index]?.setValue(product ?? '');
  }

  displayCustomer(customer: CustomerDto | string | null): string {
    return typeof customer === 'string' ? customer : (customer?.name ?? '');
  }

  displayProduct(product: ProductDto | string | null): string {
    return typeof product === 'string' ? product : (product?.name ?? '');
  }

  onCustomerSelected(customer: CustomerDto): void {
    this.customerId.set(customer.customerId);
  }

  onCustomerInput(value: string): void {
    if (value.trim()) return;
    this.customerId.set(null);
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

  productName(productId: number | null): string {
    if (!productId) return '';
    return this.products().find((product) => product.productId === productId)?.name ?? '';
  }

  productPrice(productId: number | null): string {
    if (!productId) return '-';
    const val = this.products().find((product) => product.productId === productId)?.sellingPrice;
    if (val == null) return '-';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  toggleEstimationPanel(): void {
    this.showEstimationPanel.update((v) => !v);
  }

  isEstimationSelected(id: number): boolean {
    return this.selectedEstimationIds().has(id);
  }

  toggleEstimation(est: EstimationForSoDto): void {
    const ids = new Set(this.selectedEstimationIds());
    if (ids.has(est.estimationId)) {
      ids.delete(est.estimationId);
      this.lineItems.update((items) => items.filter((i) => i.estimationId !== est.estimationId));
    } else {
      ids.add(est.estimationId);
      const existingProductIds = new Set(
        this.lineItems()
          .filter((i) => i.estimationId === est.estimationId)
          .map((i) => i.productId),
      );
      const newItems: SoLineItem[] = est.items
        .filter((it) => !existingProductIds.has(it.productId))
        .map((it) => this.estimationItemToLineItem(it, est));
      this.lineItems.update((items) => [...items, ...newItems]);
    }
    this.selectedEstimationIds.set(ids);
    this.resetProductControls(this.lineItems());
  }

  private estimationItemToLineItem(
    item: EstimationForSoDto['items'][number],
    est: EstimationForSoDto,
  ): SoLineItem {
    const product = this.products().find((p) => p.productId === item.productId);
    return {
      productId: item.productId,
      productName: item.productName,
      unitShortName: item.unitShortName ?? '',
      quantity: item.quantity,
      unitPrice: product?.sellingPrice ?? undefined,
      estimationId: est.estimationId,
      estimationNumber: est.estimationNumber,
      estimationItemId: item.estimationItemId,
    };
  }

  applyEstimations(): void {
    this.showEstimationPanel.set(false);
  }

  private resetProductControls(items: SoLineItem[]): void {
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

  private filterCustomers(value: CustomerDto | string | null): CustomerDto[] {
    const search = typeof value === 'string' ? value : (value?.name ?? '');
    const filterValue = search.toLowerCase();
    return this.customers().filter((customer) => customer.name.toLowerCase().includes(filterValue));
  }

  private filterProducts(value: ProductDto | string | null): ProductDto[] {
    const search = typeof value === 'string' ? value : (value?.name ?? '');
    const filterValue = search.toLowerCase();
    return this.products().filter((product) => product.name.toLowerCase().includes(filterValue));
  }

  private customerById(customerId: number | null): CustomerDto | undefined {
    if (!customerId) return undefined;
    return this.customers().find((customer) => customer.customerId === customerId);
  }

  private productById(productId: number | null): ProductDto | undefined {
    if (!productId) return undefined;
    return this.products().find((product) => product.productId === productId);
  }

  save(): void {
    const items = this.lineItems()
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId!,
        estimationId: item.estimationId ?? undefined,
        estimationItemId: item.estimationItemId ?? undefined,
        quantity: item.quantity,
      }));

    this.saving.set(true);

    const payload = {
      customerId: this.customerId() ?? undefined,
      taxPercentage: this.taxPercentage() ?? undefined,
      remarks: this.remarks() || undefined,
      items,
    };

    if (this.isEdit) {
      this.svc
        .update(this.id, payload)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: (res) => {
            if (res.isSuccess) this.cancel();
          },
        });
      return;
    }

    this.svc
      .create(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.cancel();
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/sales/order']);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
