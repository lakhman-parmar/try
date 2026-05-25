import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesInvoiceDetailDto } from '../models/sales-invoice.model';

function formatCurrency(val?: number | null): string {
  if (val == null) return '-';
  return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function downloadSalesInvoicePdf(invoice: SalesInvoiceDetailDto): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;

  const BLUE: [number, number, number] = [3, 105, 161];
  const LIGHT_BG: [number, number, number] = [240, 249, 255];
  const TEXT_DARK: [number, number, number] = [15, 23, 42];
  const TEXT_MID: [number, number, number] = [71, 85, 105];
  const TEXT_LIGHT: [number, number, number] = [148, 163, 184];
  const AMBER: [number, number, number] = [244, 185, 66];

  let y = 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BLUE);
  doc.text('RapidDev', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MID);
  doc.text('Sales Division', margin, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BLUE);
  doc.text('SALES INVOICE', pageW - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MID);
  doc.text(invoice.invoiceNumber, pageW - margin, y + 5, { align: 'right' });

  y += 10;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'F');

  const col1x = margin + 6;
  const col2x = margin + contentW / 2 + 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text('CUSTOMER', col1x, y + 6);
  doc.text('INVOICE DATE', col2x, y + 6);
  doc.text('INVOICE NUMBER', col1x, y + 16);
  doc.text('TAX RATE', col2x, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text(invoice.customerName ?? '-', col1x, y + 11);
  doc.text(formatDate(invoice.createdAt), col2x, y + 11);
  doc.text(invoice.invoiceNumber, col1x, y + 21);
  doc.text(invoice.taxPercentage != null ? `${invoice.taxPercentage}%` : '-', col2x, y + 21);

  y += 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLUE);
  doc.text('LINE ITEMS', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Product', 'Unit', 'Qty', 'Unit Price', 'Amount', 'Sales Order']],
    body: invoice.items.map((item, idx) => [
      String(idx + 1),
      item.productName,
      item.unitShortName ?? '-',
      String(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.unitPrice != null ? item.quantity * item.unitPrice : null),
      item.salesOrderNumber ?? '-',
    ]),
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      textColor: TEXT_DARK,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BLUE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: LIGHT_BG,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 54 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 14 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 26 },
      6: { cellWidth: 38 },
    },
  });

  const subTotal = invoice.items.reduce(
    (sum, item) => sum + (item.unitPrice != null ? item.quantity * item.unitPrice : 0),
    0,
  );
  const taxAmount = invoice.taxPercentage ? (subTotal * invoice.taxPercentage) / 100 : 0;
  const grandTotal = subTotal + taxAmount;

  y = (doc as any).lastAutoTable.finalY + 6;

  const hasTax = invoice.taxPercentage != null;
  const boxH = hasTax ? 22 : 14;
  const totalsBoxW = 70;
  const totalsBoxX = pageW - margin - totalsBoxW;
  const labelX = totalsBoxX + 5;
  const valX = totalsBoxX + totalsBoxW - 5;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(totalsBoxX, y, totalsBoxW, boxH, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Sub Total', labelX, y + 7);
  doc.text(formatCurrency(subTotal), valX, y + 7, { align: 'right' });

  if (hasTax) {
    doc.text(`Tax (${invoice.taxPercentage}%)`, labelX, y + 13);
    doc.text(formatCurrency(taxAmount), valX, y + 13, { align: 'right' });
    doc.setDrawColor(...BLUE);
    doc.line(totalsBoxX + 3, y + 15, totalsBoxX + totalsBoxW - 3, y + 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    doc.text('Grand Total', labelX, y + 21);
    doc.text(formatCurrency(grandTotal), valX, y + 21, { align: 'right' });
    y += 28;
  } else {
    doc.setDrawColor(...BLUE);
    doc.line(totalsBoxX + 3, y + 9, totalsBoxX + totalsBoxW - 3, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    doc.text('Grand Total', labelX, y + 14);
    doc.text(formatCurrency(grandTotal), valX, y + 14, { align: 'right' });
    y += 20;
  }

  if (invoice.remarks) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BLUE);
    doc.text('REMARKS', margin, y);
    y += 4;

    doc.setFillColor(255, 251, 230);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
    doc.setFillColor(...AMBER);
    doc.rect(margin, y, 2, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MID);
    doc.text(invoice.remarks, margin + 6, y + 7);
  }

  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(
    `Generated on ${formatDate(new Date().toISOString())} - RapidDev Sales System`,
    margin,
    footerY,
  );

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
