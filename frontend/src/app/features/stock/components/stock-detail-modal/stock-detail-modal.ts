import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { StockDetailDto } from '../../models/stock.model';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-detail-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './stock-detail-modal.html',
  styleUrl: './stock-detail-modal.scss',
})
export class StockDetailModal implements OnInit {
  private readonly svc = inject(StockService);

  productId = input.required<number>();
  productName = input<string>('');

  close = output<void>();

  loading = signal(false);
  detail = signal<StockDetailDto | null>(null);

  movementColumns = ['date', 'type', 'quantity', 'price', 'reason'];

  ngOnInit(): void {
    this.loading.set(true);
    this.svc
      .getById(this.productId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.detail.set(res.data);
        },
      });
  }

  recordTypeLabel(type: number): string {
    return type === 1 ? 'Purchase' : 'Sales';
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatQty(val?: number | null): string {
    if (val == null) return '—';
    return val.toLocaleString('en-IN', { maximumFractionDigits: 3 });
  }

  formatCurrency(val?: number | null): string {
    if (val == null) return '—';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
