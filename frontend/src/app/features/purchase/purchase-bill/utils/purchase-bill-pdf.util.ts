import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseBillDetailDto } from '../models/purchase-bill.model';

function formatCurrency(val?: number | null): string {
  if (val == null) return '\u2014';
  return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function downloadPurchaseBillPdf(bill: PurchaseBillDetailDto): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // ── Colour palette ──────────────────────────────────────────────────────────
  const GREEN: [number, number, number] = [45, 106, 79];
  const LIGHT_GREEN_BG: [number, number, number] = [245, 249, 247];
  const TEXT_DARK: [number, number, number] = [26, 26, 46];
  const TEXT_MID: [number, number, number] = [85, 85, 85];
  const TEXT_LIGHT: [number, number, number] = [170, 170, 170];
  const AMBER: [number, number, number] = [244, 185, 66];

  let y = 14;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...GREEN);
  doc.text('RapidDev', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MID);
  doc.text('Purchase Division', margin, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...GREEN);
  doc.text('PURCHASE BILL', pageW - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MID);
  doc.text(bill.billNumber, pageW - margin, y + 5, { align: 'right' });

  // Divider
  y += 10;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Meta grid ───────────────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_GREEN_BG);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'F');

  const col1x = margin + 6;
  const col2x = margin + contentW / 2 + 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text('SUPPLIER',    col1x, y + 6);
  doc.text('BILL DATE',   col2x, y + 6);
  doc.text('BILL NUMBER', col1x, y + 16);
  doc.text('TAX RATE',    col2x, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text(bill.supplierName ?? '\u2014',                                        col1x, y + 11);
  doc.text(formatDate(bill.createdAt),                                           col2x, y + 11);
  doc.text(bill.billNumber,                                                      col1x, y + 21);
  doc.text(bill.taxPercentage != null ? `${bill.taxPercentage}%` : '\u2014',    col2x, y + 21);

  y += 28;

  // ── Line items table ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREEN);
  doc.text('LINE ITEMS', margin, y);
  y += 4;

  const tableBody = bill.items.map((item, idx) => [
    String(idx + 1),
    item.productName,
    item.unitShortName ?? '\u2014',
    String(item.quantity),
    formatCurrency(item.unitPrice),
    formatCurrency(item.unitPrice != null ? item.quantity * item.unitPrice : null),
    item.poNumber ?? '\u2014',
    item.requisitionNo ?? '\u2014',
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Product', 'Unit', 'Qty', 'Unit Price', 'Amount', 'PO No.', 'Req. No.']],
    body: tableBody,
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      textColor: TEXT_DARK,
      lineColor: [224, 236, 229],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: GREEN,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: LIGHT_GREEN_BG,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 40 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right',  cellWidth: 12 },
      4: { halign: 'right',  cellWidth: 22 },
      5: { halign: 'right',  cellWidth: 22 },
      6: { cellWidth: 26 },
      7: { cellWidth: 26 },
    },
  });

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subTotal  = bill.items.reduce(
    (sum, item) => sum + (item.unitPrice != null ? item.quantity * item.unitPrice : 0), 0,
  );
  const taxAmount  = bill.taxPercentage ? (subTotal * bill.taxPercentage) / 100 : 0;
  const grandTotal = subTotal + taxAmount;

  y = (doc as any).lastAutoTable.finalY + 6;

  const hasTax     = bill.taxPercentage != null;
  const boxH       = hasTax ? 22 : 14;
  const totalsBoxW = 70;
  const totalsBoxX = pageW - margin - totalsBoxW;
  const labelX     = totalsBoxX + 5;
  const valX       = totalsBoxX + totalsBoxW - 5;

  doc.setFillColor(...LIGHT_GREEN_BG);
  doc.roundedRect(totalsBoxX, y, totalsBoxW, boxH, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Sub Total',              labelX, y + 7);
  doc.text(formatCurrency(subTotal), valX,   y + 7, { align: 'right' });

  if (hasTax) {
    doc.text(`Tax (${bill.taxPercentage}%)`, labelX, y + 13);
    doc.text(formatCurrency(taxAmount),       valX,   y + 13, { align: 'right' });

    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.4);
    doc.line(totalsBoxX + 3, y + 15, totalsBoxX + totalsBoxW - 3, y + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...GREEN);
    doc.text('Grand Total',              labelX, y + 21);
    doc.text(formatCurrency(grandTotal), valX,   y + 21, { align: 'right' });
    y += 28;
  } else {
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.4);
    doc.line(totalsBoxX + 3, y + 9, totalsBoxX + totalsBoxW - 3, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...GREEN);
    doc.text('Grand Total',              labelX, y + 14);
    doc.text(formatCurrency(grandTotal), valX,   y + 14, { align: 'right' });
    y += 20;
  }

  // ── Remarks ──────────────────────────────────────────────────────────────────
  if (bill.remarks) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...GREEN);
    doc.text('REMARKS', margin, y);
    y += 4;

    doc.setFillColor(255, 251, 230);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
    doc.setFillColor(...AMBER);
    doc.rect(margin, y, 2, 12, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MID);
    doc.text(bill.remarks, margin + 6, y + 7);
    y += 18;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 14;

  doc.setDrawColor(224, 236, 229);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(
    `Generated on ${formatDate(new Date().toISOString())} \u2022 RapidDev Purchase System`,
    margin,
    footerY,
  );

  const sigX = pageW - margin - 40;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(sigX, footerY - 2, pageW - margin, footerY - 2);
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text('Authorised Signatory', sigX + 20, footerY, { align: 'center' });

  // ── Save ─────────────────────────────────────────────────────────────────────
  doc.save(`${bill.billNumber}.pdf`);
}