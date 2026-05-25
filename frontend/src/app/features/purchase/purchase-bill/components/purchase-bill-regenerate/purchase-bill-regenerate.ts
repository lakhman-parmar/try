import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { PurchaseBillService } from '../../services/purchase-bill.sevice';
import {
  PurchaseBillDetailDto,
  RegeneratePurchaseBillDto,
} from '../../models/purchase-bill.model';
import { downloadPurchaseBillPdf } from '../../utils/purchase-bill-pdf.util';

@Component({
  selector: 'app-purchase-bill-regenerate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-bill-regenerate.html',
  styleUrl: './purchase-bill-regenerate.scss',
})
export class PurchaseBillRegenerate implements OnInit {
  private readonly svc = inject(PurchaseBillService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = signal(true);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  sourceBill = signal<PurchaseBillDetailDto | null>(null);

  regenTaxPercentage = signal<number | null>(null);
  regenRemarks = signal('');

  showConfirm = signal(false);

  readonly subTotal = computed(() => {
    const bill = this.sourceBill();
    if (!bill) return 0;
    return bill.items.reduce(
      (sum, item) => sum + (item.unitPrice != null ? item.quantity * item.unitPrice : 0),
      0,
    );
  });

  readonly taxAmount = computed(() => {
    const tax = this.regenTaxPercentage();
    return tax ? (this.subTotal() * tax) / 100 : 0;
  });

  readonly grandTotal = computed(() => this.subTotal() + this.taxAmount());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMsg.set('No bill ID provided.');
      this.loading.set(false);
      return;
    }
    this.loadBill(+id);
  }

  private loadBill(id: number): void {
    this.loading.set(true);
    this.svc
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.sourceBill.set(res.data);
            this.regenTaxPercentage.set(res.data.taxPercentage ?? null);
            this.regenRemarks.set('');
          } else {
            this.errorMsg.set(res.message ?? 'Failed to load bill.');
          }
        },
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Failed to load bill.');
        },
      });
  }

  requestRegenerate(): void {
    this.showConfirm.set(true);
  }

  cancelConfirm(): void {
    this.showConfirm.set(false);
  }

  confirmRegenerate(): void {
    const source = this.sourceBill();
    if (!source) return;
    this.showConfirm.set(false);
    const dto: RegeneratePurchaseBillDto = {
      taxPercentage: this.regenTaxPercentage() ?? undefined,
      remarks: this.regenRemarks() || undefined,
    };
    this.saving.set(true);
    this.svc
      .regenerate(source.purchaseBillId, dto)
      .pipe(
        switchMap((regenRes) => {
          if (!regenRes.isSuccess) {
            throw new Error(regenRes.message ?? 'Failed to regenerate purchase bill.');
          }
          // Stock updated in DB. Fetch the new bill detail for PDF.
          return this.svc.getById(regenRes.data.purchaseBillId);
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: async (detailRes) => {
          if (detailRes.isSuccess) {
            await downloadPurchaseBillPdf(detailRes.data);
            this.router.navigate(['/admin/purchase/bill']);
          } else {
            this.errorMsg.set(detailRes.message ?? 'Failed to load regenerated bill for PDF.');
          }
        },
        error: (err) => {
          this.errorMsg.set(err?.message ?? err?.error?.message ?? 'Failed to regenerate purchase bill.');
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/purchase/bill']);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showConfirm.set(false);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '\u2014';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  trackByIndex(index: number): number {
    return index;
  }
}