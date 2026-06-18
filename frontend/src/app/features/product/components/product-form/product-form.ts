import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductFormModal implements OnInit {
  private readonly svc = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  productId = input<number | null>(null);
  closed = output<boolean>(); // true = saved, false = cancelled

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  units = signal<UnitDto[]>([]);

  productForm!: FormGroup;

  get title(): string {
    return this.isEdit() ? 'Edit Product' : 'New Product';
  }

  get canSave(): boolean {
    return this.productForm && this.productForm.valid;
  }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(500)]],
      description: [''],
      sellingPrice: [null, [Validators.required, Validators.min(0)]],
      unitId: [null, Validators.required],
    });

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
              this.productForm.patchValue({
                name: r.data.name,
                description: r.data.description ?? '',
                sellingPrice: r.data.sellingPrice ?? null,
                unitId: r.data.unitId ?? null,
              });
            }
          },
        });
    }
  }

  save(): void {
    if (!this.canSave || this.saving()) return;
    this.saving.set(true);

    const formVal = this.productForm.value;
    const dto: CreateProductDto | UpdateProductDto = {
      name: formVal.name.trim(),
      description: formVal.description?.trim() || undefined,
      sellingPrice: formVal.sellingPrice ?? undefined,
      unitId: formVal.unitId ?? undefined,
    };

    const obs$: Observable<ApiResponse<number | boolean>> = this.isEdit()
      ? this.svc.update(this.productId()!, dto as UpdateProductDto)
      : this.svc.create(dto as CreateProductDto);

    obs$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (r: ApiResponse<number | boolean>) => {
        if (r.isSuccess) {
          this.closed.emit(true);
        }
      },
    });
  }

  cancel(): void {
    this.closed.emit(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) this.cancel();
  }
}
