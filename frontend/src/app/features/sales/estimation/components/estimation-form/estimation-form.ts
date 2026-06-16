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
import { CustomerDto, EstimationLineItem, ProductDto } from '../../models/estimation.model';
import { EstimationService } from '../../services/estimation.service';

@Component({
  selector: 'app-estimation-form',
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
  templateUrl: './estimation-form.html',
  styleUrl: './estimation-form.scss',
})
export class EstimationForm implements OnInit {
  private readonly svc = inject(EstimationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly isEdit = Number.isFinite(this.id) && this.id > 0;
  readonly title = this.isEdit ? 'Edit Estimation' : 'New Estimation';
  readonly displayedColumns = ['product', 'unit', 'quantity', 'unitPrice', 'total', 'actions'];

  loading = signal(false);
  saving = signal(false);
  customers = signal<CustomerDto[]>([]);
  products = signal<ProductDto[]>([]);
  customerId = signal<number | null>(null);
  customerControl = new FormControl<CustomerDto | string>('', { nonNullable: true });
  filteredCustomers$!: Observable<CustomerDto[]>;
  remarks = signal('');
  lineItems = signal<EstimationLineItem[]>([{ productId: null, quantity: 1, unitPrice: null }]);
  productControls: FormControl<ProductDto | string>[] = [];
  filteredProductOptions: Observable<ProductDto[]>[] = [];

  validLineCount = computed(() => this.lineItems().filter((item) => item.productId).length);
  canSave = computed(() => this.customerId() != null && this.validLineCount() > 0);

  ngOnInit(): void {
    this.loading.set(true);
    this.filteredCustomers$ = this.customerControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterCustomers(value)),
    );
    this.resetProductControls(this.lineItems());

    if (this.isEdit) {
      forkJoin({
        products: this.svc.getProducts(),
        customers: this.svc.getCustomers(),
        detail: this.svc.getById(this.id),
      })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.products.isSuccess) this.products.set(res.products.data);
            if (res.customers.isSuccess) this.customers.set(res.customers.data);
            this.customerControl.setValue(this.customerControl.value ?? '');

            if (res.detail.isSuccess) {
              const detail = res.detail.data;
              this.customerId.set(detail.customerId ?? null);
              this.customerControl.setValue(this.customerById(detail.customerId ?? null) ?? '');
              this.remarks.set(detail.remarks ?? '');
              const items = detail.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice ?? null,
              }));
              this.lineItems.set(items);
              this.resetProductControls(items);
            }
          },
          error: () => {},
        });
      return;
    }

    forkJoin({
      products: this.svc.getProducts(),
      customers: this.svc.getCustomers(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.products.isSuccess) this.products.set(res.products.data);
          if (res.customers.isSuccess) this.customers.set(res.customers.data);
          this.customerControl.setValue(this.customerControl.value ?? '');
          this.resetProductControls(this.lineItems());
        },
      });
  }

  addLineItem(): void {
    this.lineItems.update((items) => [...items, { productId: null, quantity: 1, unitPrice: null }]);
    this.addProductControl();
  }

  removeLineItem(index: number): void {
    this.lineItems.update((items) => items.filter((_, i) => i !== index));
    this.productControls.splice(index, 1);
    this.filteredProductOptions.splice(index, 1);
  }

  updateProduct(index: number, productId: number | null): void {
    this.lineItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, productId } : item)),
    );
    this.productControls[index]?.setValue(this.productById(productId) ?? '');
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
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: product.productId,
              unitPrice: item.unitPrice ?? product.sellingPrice ?? null,
            }
          : item,
      ),
    );
  }

  onProductInput(index: number, value: string): void {
    if (value.trim()) return;
    this.lineItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, productId: null, unitPrice: null } : item)),
    );
  }

  updateQuantity(index: number, quantity: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity || 1) } : item,
      ),
    );
  }

  updateUnitPrice(index: number, price: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index ? { ...item, unitPrice: Math.max(0, price || 0) || null } : item,
      ),
    );
  }

  itemTotal(item: EstimationLineItem): number {
    if (!item.productId || !item.unitPrice || !item.quantity) return 0;
    return item.unitPrice * item.quantity;
  }

  grandTotal(): number {
    return this.lineItems().reduce((sum, item) => sum + this.itemTotal(item), 0);
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

  customerName(customerId: number | null): string {
    if (!customerId) return '';
    return this.customers().find((customer) => customer.customerId === customerId)?.name ?? '';
  }

  productName(productId: number | null): string {
    if (!productId) return '';
    return this.products().find((product) => product.productId === productId)?.name ?? '';
  }

  private resetProductControls(items: EstimationLineItem[]): void {
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
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? undefined,
      }));

    this.saving.set(true);

    const payload = {
      customerId: this.customerId() ?? undefined,
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
    this.router.navigate(['/admin/sales/estimation']);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
