import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { SalesReturnService } from '../../services/sales-return.service';
import {
  CreateSalesReturnDto,
  ReturnLineItem,
  SalesInvoiceForReturnDto,
  SalesInvoiceItemForReturnDto,
} from '../../models/sales-return.model';
import { getApiErrorMessage } from '../../../sales-invoice/utils/error-message.util';

@Component({
  selector: 'app-sales-return-create',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './sales-return-create.html',
  styleUrl: './sales-return-create.scss',
})
export class SalesReturnCreate implements OnInit {
  private readonly svc = inject(SalesReturnService);
  private readonly router = inject(Router);

  saving = signal(false);
  loadingInvoices = signal(false);
  errorMsg = signal<string | null>(null);
  formRemarks = signal('');
  invoicesForReturn = signal<SalesInvoiceForReturnDto[]>([]);
  selectedInvoiceId = signal<number | null>(null);
  showInvoicePanel = signal(false);
  lineItems = signal<ReturnLineItem[]>([]);
  displayedColumns = [
    'product',
    'unit',
    'invoiceQuantity',
    'returnedQuantity',
    'returnableQuantity',
    'quantity',
    'unitPrice',
    'actions',
  ];
  showConfirmModal = signal(false);

  readonly selectedInvoice = computed(() =>
    this.invoicesForReturn().find((invoice) => invoice.salesInvoiceId === this.selectedInvoiceId()),
  );
  readonly subTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
  );
  readonly validLineCount = computed(() => this.lineItems().length);

  ngOnInit(): void {
    this.loadingInvoices.set(true);
    this.svc
      .getInvoicesForReturn()
      .pipe(finalize(() => this.loadingInvoices.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) this.invoicesForReturn.set(res.data);
        },
        error: (err) =>
          this.errorMsg.set(getApiErrorMessage(err, 'Failed to load invoices for return.')),
      });
  }

  toggleInvoicePanel(): void {
    this.showInvoicePanel.update((value) => !value);
  }

  isInvoiceSelected(id: number): boolean {
    return this.selectedInvoiceId() === id;
  }

  selectInvoice(invoice: SalesInvoiceForReturnDto): void {
    this.selectedInvoiceId.set(invoice.salesInvoiceId);
    this.lineItems.set(invoice.items.map((item) => this.invoiceItemToLineItem(item, invoice)));
    this.showInvoicePanel.set(false);
    this.errorMsg.set(null);
  }

  private invoiceItemToLineItem(
    item: SalesInvoiceItemForReturnDto,
    invoice: SalesInvoiceForReturnDto,
  ): ReturnLineItem {
    return {
      productId: item.productId,
      productName: item.productName,
      unitShortName: item.unitShortName ?? '',
      invoiceQuantity: item.quantity,
      returnedQuantity: item.returnedQuantity,
      returnableQuantity: item.returnableQuantity,
      quantity: item.returnableQuantity,
      unitPrice: item.unitPrice ?? undefined,
      salesInvoiceId: invoice.salesInvoiceId,
      invoiceNumber: invoice.invoiceNumber,
      salesInvoiceItemId: item.salesInvoiceItemId,
    };
  }

  removeLineItem(index: number): void {
    this.lineItems.update((items) => items.filter((_, i) => i !== index));
  }

  updateQuantity(index: number, quantity: number): void {
    this.lineItems.update((items) =>
      items.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.min(item.returnableQuantity, Math.max(1, quantity || 1)) }
          : item,
      ),
    );
  }

  adjustQuantity(index: number, delta: number): void {
    this.updateQuantity(index, (this.lineItems()[index]?.quantity ?? 1) + delta);
  }

  requestCreateReturn(): void {
    if (!this.selectedInvoice()) {
      this.errorMsg.set('Select an invoice before creating a return.');
      return;
    }
    if (this.lineItems().length === 0) {
      this.errorMsg.set('Add at least one invoice item before creating a return.');
      return;
    }
    if (this.lineItems().some((item) => item.quantity > item.returnableQuantity)) {
      this.errorMsg.set('One or more return items exceed the returnable quantity.');
      return;
    }
    this.errorMsg.set(null);
    this.showConfirmModal.set(true);
  }

  confirmCreateReturn(): void {
    const invoice = this.selectedInvoice();
    if (!invoice) return;

    this.showConfirmModal.set(false);
    const dto: CreateSalesReturnDto = {
      salesInvoiceId: invoice.salesInvoiceId,
      customerId: invoice.customerId,
      remarks: this.formRemarks() || undefined,
      items: this.lineItems().map((item) => ({
        productId: item.productId,
        salesInvoiceId: item.salesInvoiceId,
        salesInvoiceItemId: item.salesInvoiceItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? undefined,
      })),
    };

    this.saving.set(true);
    this.svc
      .create(dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.router.navigate(['/admin/sales/return']);
          } else {
            this.errorMsg.set(res.message ?? 'Failed to create sales return.');
          }
        },
        error: (err) =>
          this.errorMsg.set(getApiErrorMessage(err, 'Failed to create sales return.')),
      });
  }

  cancelConfirm(): void {
    this.showConfirmModal.set(false);
  }

  cancel(): void {
    this.router.navigate(['/admin/sales/return']);
  }

  formatCurrency(val?: number | null): string {
    return val == null
      ? '-'
      : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
