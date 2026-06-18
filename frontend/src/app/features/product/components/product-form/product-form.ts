import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, finalize } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CreateProductDto, UnitDto, UpdateProductDto } from '../../models/product.model';

interface ApiResponse<T> {
  isSuccess: boolean;
  message?: string;
  data: T;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductFormModal implements OnInit {
  private readonly svc = inject(ProductService);

  productId = input<number | null>(null);
  closed = output<boolean>(); // true = saved, false = cancelled

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  units = signal<UnitDto[]>([]);
  error = signal('');

  // Form fields
  name = signal('');
  description = signal('');
  sellingPrice = signal<number | null>(null);
  unitId = signal<number | null>(null);

  get title(): string {
    return this.isEdit() ? 'Edit Product' : 'New Product';
  }

  get canSave(): boolean {
    return this.name().trim().length > 0;
  }

  ngOnInit(): void {
    this.svc.getUnits().subscribe({
      next: (r: ApiResponse<UnitDto[]>) => {
        if (r.isSuccess) this.units.set(r.data);
      },
    });

    const id = this.productId();
    if (id !== null) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.svc
        .getById(id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (r) => {
            if (r.isSuccess && r.data) {
              this.name.set(r.data.name);
              this.description.set(r.data.description ?? '');
              this.sellingPrice.set(r.data.sellingPrice ?? null);
              this.unitId.set(r.data.unitId ?? null);
            }
          },
        });
    }
  }

  save(): void {
    if (!this.canSave || this.saving()) return;
    this.saving.set(true);
    this.error.set('');

    const dto: CreateProductDto | UpdateProductDto = {
      name: this.name().trim(),
      description: this.description().trim() || undefined,
      sellingPrice: this.sellingPrice() ?? undefined,
      unitId: this.unitId() ?? undefined,
    };

    const obs$: Observable<ApiResponse<number | boolean>> = this.isEdit()
      ? this.svc.update(this.productId()!, dto as UpdateProductDto)
      : this.svc.create(dto as CreateProductDto);

    obs$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (r: ApiResponse<number | boolean>) => {
        if (r.isSuccess) {
          this.closed.emit(true);
        } else {
          this.error.set(r.message || 'Failed to save product.');
        }
      },
      error: () => this.error.set('An unexpected error occurred.'),
    });
  }

  cancel(): void {
    this.closed.emit(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) this.cancel();
  }
}
