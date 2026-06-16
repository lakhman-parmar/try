import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SalesInvoiceService } from '../../services/sales-invoice.service';
import { RegenerateSalesInvoiceDto, SalesInvoiceDetailDto } from '../../models/sales-invoice.model';

@Component({
  selector: 'app-sales-invoice-regenerate',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './sales-invoice-regenerate.html',
  styleUrl: './sales-invoice-regenerate.scss',
})
export class SalesInvoiceRegenerate implements OnInit {
  private readonly svc = inject(SalesInvoiceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = signal(true);
  saving = signal(false);
  sourceInvoice = signal<SalesInvoiceDetailDto | null>(null);
  regenTaxPercentage = signal<number | null>(null);
  regenRemarks = signal('');
  showConfirm = signal(false);
  displayedColumns = ['product', 'unit', 'so', 'quantity', 'unitPrice', 'total'];

  readonly subTotal = computed(() => {
    const invoice = this.sourceInvoice();
    return (
      invoice?.items.reduce(
        (sum, item) => sum + (item.unitPrice != null ? item.quantity * item.unitPrice : 0),
        0,
      ) ?? 0
    );
  });
  readonly taxAmount = computed(() =>
    this.regenTaxPercentage() ? (this.subTotal() * this.regenTaxPercentage()!) / 100 : 0,
  );
  readonly grandTotal = computed(() => this.subTotal() + this.taxAmount());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.loadInvoice(+id);
  }

  private loadInvoice(id: number): void {
    this.loading.set(true);
    this.svc
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.sourceInvoice.set(res.data);
            this.regenTaxPercentage.set(res.data.taxPercentage ?? null);
            this.regenRemarks.set('');
          }
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
    const source = this.sourceInvoice();
    if (!source) return;
    this.showConfirm.set(false);
    const dto: RegenerateSalesInvoiceDto = {
      taxPercentage: this.regenTaxPercentage() ?? undefined,
      remarks: this.regenRemarks() || undefined,
    };
    this.saving.set(true);
    this.svc
      .regenerate(source.salesInvoiceId, dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (regenRes) => {
          if (regenRes.isSuccess) {
            this.svc.downloadPdf(regenRes.data.salesInvoiceId);
            this.router.navigate(['/admin/sales/invoice']);
          }
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/sales/invoice']);
  }
  formatDate(dateStr?: string | null): string {
    return dateStr
      ? new Date(dateStr).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-';
  }
  formatCurrency(val?: number | null): string {
    return val == null
      ? '-'
      : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
