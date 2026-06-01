import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PurchaseReturnService } from '../../services/purchase-return.service';
import {
    BillForReturnDto,
    BillItemForReturnDto,
    CreatePurchaseReturnDto,
    PurchaseReturnLineItem,
} from '../../models/purchase-return.model';
import { getApiErrorMessage } from '../../../../../features/sales/sales-invoice/utils/error-message.util';

@Component({
    selector: 'app-purchase-return-create',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatProgressSpinnerModule, MatTableModule],
    templateUrl: './purchase-return-create.html',
    styleUrl: './purchase-return-create.scss',
})
export class PurchaseReturnCreate implements OnInit {
    private readonly svc = inject(PurchaseReturnService);
    private readonly router = inject(Router);

    saving = signal(false);
    loadingBills = signal(false);
    errorMsg = signal<string | null>(null);
    formRemarks = signal('');
    billsForReturn = signal<BillForReturnDto[]>([]);
    selectedBillId = signal<number | null>(null);
    showBillPanel = signal(false);
    lineItems = signal<PurchaseReturnLineItem[]>([]);
    displayedColumns = [
        'product',
        'unit',
        'billedQuantity',
        'returnedQuantity',
        'remainingQuantity',
        'quantity',
        'unitPrice',
        'actions',
    ];
    showConfirmModal = signal(false);

    readonly selectedBill = computed(() =>
        this.billsForReturn().find((bill) => bill.purchaseBillId === this.selectedBillId()),
    );
    readonly subTotal = computed(() =>
        this.lineItems().reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
    );
    readonly validLineCount = computed(() => this.lineItems().length);

    ngOnInit(): void {
        this.loadingBills.set(true);
        this.svc
            .getBillsForReturn()
            .pipe(finalize(() => this.loadingBills.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) this.billsForReturn.set(res.data);
                },
                error: (err) =>
                    this.errorMsg.set(getApiErrorMessage(err, 'Failed to load bills for return.')),
            });
    }

    toggleBillPanel(): void {
        this.showBillPanel.update((value) => !value);
    }

    isBillSelected(id: number): boolean {
        return this.selectedBillId() === id;
    }

    selectBill(bill: BillForReturnDto): void {
        this.selectedBillId.set(bill.purchaseBillId);
        this.lineItems.set(bill.items.map((item) => this.billItemToLineItem(item, bill)));
        this.showBillPanel.set(false);
        this.errorMsg.set(null);
    }

    private billItemToLineItem(
        item: BillItemForReturnDto,
        bill: BillForReturnDto,
    ): PurchaseReturnLineItem {
        return {
            productId: item.productId,
            productName: item.productName,
            unitShortName: item.unitShortName ?? '',
            billedQuantity: item.billedQuantity,
            returnedQuantity: item.returnedQuantity,
            remainingQuantity: item.remainingQuantity,
            quantity: item.remainingQuantity,
            unitPrice: item.unitPrice ?? undefined,
            purchaseBillId: bill.purchaseBillId,
            billNumber: bill.billNumber,
            purchaseBillItemId: item.purchaseBillItemId,
        };
    }

    removeLineItem(index: number): void {
        this.lineItems.update((items) => items.filter((_, i) => i !== index));
    }

    updateQuantity(index: number, quantity: number): void {
        this.lineItems.update((items) =>
            items.map((item, i) =>
                i === index
                    ? { ...item, quantity: Math.min(item.remainingQuantity, Math.max(1, quantity || 1)) }
                    : item,
            ),
        );
    }

    adjustQuantity(index: number, delta: number): void {
        this.updateQuantity(index, (this.lineItems()[index]?.quantity ?? 1) + delta);
    }

    private adjustIntervals = new Map<string, ReturnType<typeof setInterval>>();

    startAdjust(index: number, delta: number): void {
        this.adjustQuantity(index, delta);
        const key = `${index}_${delta}`;
        if (!this.adjustIntervals.has(key)) {
            this.adjustIntervals.set(key, setInterval(() => this.adjustQuantity(index, delta), 150));
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

    requestCreateReturn(): void {
        if (!this.selectedBill()) {
            this.errorMsg.set('Select a bill before creating a return.');
            return;
        }
        if (this.lineItems().length === 0) {
            this.errorMsg.set('Add at least one bill item before creating a return.');
            return;
        }
        if (this.lineItems().some((item) => item.quantity > item.remainingQuantity)) {
            this.errorMsg.set('One or more return items exceed the remaining returnable quantity.');
            return;
        }
        this.errorMsg.set(null);
        this.showConfirmModal.set(true);
    }

    confirmCreateReturn(): void {
        const bill = this.selectedBill();
        if (!bill) return;

        this.showConfirmModal.set(false);
        const dto: CreatePurchaseReturnDto = {
            remarks: this.formRemarks() || undefined,
            items: this.lineItems().map((item) => ({
                productId: item.productId,
                purchaseBillId: item.purchaseBillId,
                purchaseBillItemId: item.purchaseBillItemId,
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
                        this.router.navigate(['/admin/purchase/return']);
                    } else {
                        this.errorMsg.set(res.message ?? 'Failed to create purchase return.');
                    }
                },
                error: (err) =>
                    this.errorMsg.set(getApiErrorMessage(err, 'Failed to create purchase return.')),
            });
    }

    cancelConfirm(): void {
        this.showConfirmModal.set(false);
    }

    cancel(): void {
        this.router.navigate(['/admin/purchase/return']);
    }

    formatCurrency(val?: number | null): string {
        return val == null
            ? '-'
            : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}