using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.Application.Services.Implementation.Purchase;

public class PurchaseBillPdfService : IPurchaseBillPdfService
{
    public PurchaseBillPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }
    private static readonly string DarkGreen  = "#2D5016";
    private static readonly string MedGreen   = "#4A7C1E";
    private static readonly string LightGreen = "#F0F4EC";
    private static readonly string HeaderBg   = "#3D6B1A";
    private static readonly string Amber      = "#FFF8E7";
    private static readonly string BorderLine = "#4A7C1E";

    public byte[] Generate(PurchaseBillDetailDto bill)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36, Unit.Point);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9).FontColor(Colors.Black));

                page.Content().Column(col =>
                {
                    col.Item().Element(ComposeHeader(bill));
                    col.Item().PaddingTop(12).Element(ComposeMetaBlock(bill));
                    col.Item().PaddingTop(16).Element(ComposeLineItems(bill));
                    col.Item().PaddingTop(8).Element(ComposeTotals(bill));

                    if (!string.IsNullOrWhiteSpace(bill.Remarks))
                        col.Item().PaddingTop(16).Element(ComposeRemarks(bill.Remarks));
                });
            });
        });

        return document.GeneratePdf();
    }

    // Header: company name left, PURCHASE BILL right
    private static Action<IContainer> ComposeHeader(PurchaseBillDetailDto bill)
    {
        return c => c.Column(col =>
        {
            col.Item().Row(row =>
            {
                // Left: company identity
                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text("RapidDev")
                         .FontSize(18).Bold().FontColor(DarkGreen);
                    inner.Item().Text("Purchase Division")
                         .FontSize(9).FontColor(Colors.Grey.Medium);
                });

                // Right: document title + bill number
                row.RelativeItem().Column(inner =>
                {
                    inner.Item().AlignRight().Text("PURCHASE BILL")
                         .FontSize(18).Bold().FontColor(DarkGreen);
                    inner.Item().AlignRight().Text(bill.BillNumber)
                         .FontSize(9).FontColor(Colors.Grey.Medium);
                });
            });

            // Green divider
            col.Item().PaddingTop(6)
               .BorderBottom(2).BorderColor(BorderLine)
               .Height(0);
        });
    }

    // Meta block: supplier, date, bill number, tax rate
    private static Action<IContainer> ComposeMetaBlock(PurchaseBillDetailDto bill)
    {
        return c => c
            .Background(LightGreen)
            .Padding(12)
            .Row(row =>
            {
                // Left column: supplier + bill number
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("SUPPLIER").FontSize(7).FontColor(Colors.Grey.Medium).Bold();
                    col.Item().PaddingTop(2).Text(bill.SupplierName ?? "—")
                         .FontSize(11).Bold().FontColor(DarkGreen);

                    col.Item().PaddingTop(8).Text("BILL NUMBER").FontSize(7).FontColor(Colors.Grey.Medium).Bold();
                    col.Item().PaddingTop(2).Text(bill.BillNumber)
                         .FontSize(10).Bold().FontColor(DarkGreen);
                });

                // Right column: date + tax
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("BILL DATE").FontSize(7).FontColor(Colors.Grey.Medium).Bold();
                    col.Item().PaddingTop(2).Text(
                            bill.CreatedAt.HasValue
                                ? bill.CreatedAt.Value.ToString("dd MMM yyyy")
                                : "—")
                         .FontSize(11).Bold().FontColor(DarkGreen);

                    col.Item().PaddingTop(8).Text("TAX RATE").FontSize(7).FontColor(Colors.Grey.Medium).Bold();
                    col.Item().PaddingTop(2).Text(
                            bill.TaxPercentage.HasValue
                                ? $"{bill.TaxPercentage:0.##}%"
                                : "—")
                         .FontSize(10).Bold().FontColor(DarkGreen);
                });
            });
    }

    // Line items table
    private static Action<IContainer> ComposeLineItems(PurchaseBillDetailDto bill)
    {
        return c => c.Column(col =>
        {
            // Section label
            col.Item().Text("LINE ITEMS")
               .FontSize(9).Bold().FontColor(MedGreen);

            col.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(22);   // #
                    cols.RelativeColumn(3);    // Product
                    cols.ConstantColumn(36);   // Unit
                    cols.ConstantColumn(32);   // Qty
                    cols.ConstantColumn(54);   // Unit Price
                    cols.ConstantColumn(54);   // Amount
                });

                // Header row
                static IContainer HeaderCell(IContainer container) =>
                    container.Background(HeaderBg).Padding(5).AlignMiddle();

                table.Header(header =>
                {
                    void H(string label) =>
                        header.Cell().Element(HeaderCell)
                              .Text(label).FontSize(8).Bold().FontColor(Colors.White);

                    H("#"); H("Product"); H("Unit"); H("Qty");
                    H("Unit Price"); H("Amount");
                });

                // Data rows
                var items = bill.Items.ToList();
                for (int i = 0; i < items.Count; i++)
                {
                    var item   = items[i];
                    bool even  = i % 2 == 0;
                    string bg  = even ? Colors.White : LightGreen;

                    IContainer DataCell(IContainer container) =>
                        container.Background(bg)
                                 .BorderBottom(1).BorderColor("#E8EDE4")
                                 .Padding(5).AlignMiddle();

                    void D(string text, bool right = false)
                    {
                        var cell = table.Cell().Element(DataCell);
                        var t = cell.Text(text).FontSize(8);
                        if (right) cell.AlignRight();
                    }

                    decimal amount = item.Quantity * (item.UnitPrice ?? 0m);

                    table.Cell().Element(DataCell).AlignCenter().Text((i + 1).ToString()).FontSize(8);
                    table.Cell().Element(DataCell).Text(item.ProductName).FontSize(8);
                    table.Cell().Element(DataCell).AlignCenter().Text(item.UnitShortName ?? "").FontSize(8);
                    table.Cell().Element(DataCell).AlignCenter().Text(item.Quantity.ToString("0.##")).FontSize(8);
                    table.Cell().Element(DataCell).AlignRight().Text((item.UnitPrice ?? 0).ToString("0.00")).FontSize(8);
                    table.Cell().Element(DataCell).AlignRight().Text(amount.ToString("0.00")).FontSize(8);                }
            });
        });
    }

    // Totals block (right-aligned)
    private static Action<IContainer> ComposeTotals(PurchaseBillDetailDto bill)
    {
        decimal subTotal = bill.Items.Sum(i => i.Quantity * (i.UnitPrice ?? 0m));
        decimal taxAmt   = subTotal * ((bill.TaxPercentage ?? 0m) / 100m);
        decimal grand    = subTotal + taxAmt;

        return c => c.AlignRight().Column(col =>
        {
            col.Item().Width(220).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn();
                    cols.ConstantColumn(80);
                });

                IContainer TotalCell(IContainer container, bool bold = false, bool highlight = false) =>
                    container
                        .Background(highlight ? LightGreen : Colors.White)
                        .BorderBottom(1).BorderColor("#E8EDE4")
                        .PaddingVertical(5).PaddingHorizontal(8)
                        .AlignMiddle();

                void Row(string label, string value, bool bold = false, bool highlight = false)
                {
                    var lCell = table.Cell().Element(c => TotalCell(c, bold, highlight));
                    var rCell = table.Cell().Element(c => TotalCell(c, bold, highlight));

                    if (bold)
                    {
                        lCell.Text(label).FontSize(9).Bold().FontColor(DarkGreen);
                        rCell.AlignRight().Text(value).FontSize(9).Bold().FontColor(DarkGreen);
                    }
                    else
                    {
                        lCell.Text(label).FontSize(9);
                        rCell.AlignRight().Text(value).FontSize(9);
                    }
                }

                Row("Sub Total",
                    subTotal.ToString("0.00"));
                Row($"Tax ({bill.TaxPercentage:0.##}%)",
                    taxAmt.ToString("0.00"));
                Row("Grand Total",
                    grand.ToString("0.00"),
                    bold: true,
                    highlight: true);
            });
        });
    }

    // Remarks
    private static Action<IContainer> ComposeRemarks(string remarks)
    {
        return c => c.Column(col =>
        {
            col.Item().Text("REMARKS")
               .FontSize(9).Bold().FontColor(MedGreen);

            col.Item().PaddingTop(6)
               .Background(Amber)
               .BorderLeft(4).BorderColor("#E8A000")
               .Padding(10)
               .Text(remarks).FontSize(9);
        });
    }
}
