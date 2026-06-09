using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.Application.Services.Implementation.Sales;

public class SalesInvoicePdfService : ISalesInvoicePdfService
{
    private const string Blue = "#0369A1";
    private const string LightBlue = "#F0F9FF";
    private const string BorderColor = "#E2E8F0";
    private const string Amber = "#FFFBE6";

    public SalesInvoicePdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Generate(SalesInvoiceDetailDto invoice)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36, Unit.Point);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9).FontColor(Colors.Black));

                page.Content().Column(column =>
                {
                    column.Item().Element(ComposeHeader(invoice));
                    column.Item().PaddingTop(12).Element(ComposeMetaBlock(invoice));
                    column.Item().PaddingTop(16).Element(ComposeLineItems(invoice));
                    column.Item().PaddingTop(8).Element(ComposeTotals(invoice));

                    if (!string.IsNullOrWhiteSpace(invoice.Remarks))
                        column.Item().PaddingTop(16).Element(ComposeRemarks(invoice.Remarks));
                });

                page.Footer()
                    .BorderTop(1).BorderColor(BorderColor)
                    .PaddingTop(6)
                    .Text($"Generated on {DateTime.Now:dd MMM yyyy} - RapidDev Sales System")
                    .FontSize(8).FontColor(Colors.Grey.Medium);
            });
        });

        return document.GeneratePdf();
    }

    private static Action<IContainer> ComposeHeader(SalesInvoiceDetailDto invoice)
    {
        return container => container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.RelativeItem().Column(inner =>
                {
                    inner.Item().Text("RapidDev").FontSize(18).Bold().FontColor(Blue);
                    inner.Item().Text("Sales Division").FontSize(9).FontColor(Colors.Grey.Medium);
                });

                row.RelativeItem().Column(inner =>
                {
                    inner.Item().AlignRight().Text("SALES INVOICE").FontSize(18).Bold().FontColor(Blue);
                    inner.Item().AlignRight().Text(invoice.InvoiceNumber).FontSize(9).FontColor(Colors.Grey.Medium);
                });
            });

            column.Item().PaddingTop(6).BorderBottom(2).BorderColor(Blue).Height(0);
        });
    }

    private static Action<IContainer> ComposeMetaBlock(SalesInvoiceDetailDto invoice)
    {
        return container => container
            .Background(LightBlue)
            .Padding(12)
            .Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    MetaLabel(column, "CUSTOMER");
                    MetaValue(column, invoice.CustomerName ?? "-");
                    MetaLabel(column, "INVOICE NUMBER", true);
                    MetaValue(column, invoice.InvoiceNumber);
                });

                row.RelativeItem().Column(column =>
                {
                    MetaLabel(column, "INVOICE DATE");
                    MetaValue(column, invoice.CreatedAt?.ToString("dd MMM yyyy") ?? "-");
                    MetaLabel(column, "TAX RATE", true);
                    MetaValue(column, invoice.TaxPercentage.HasValue ? $"{invoice.TaxPercentage:0.##}%" : "-");
                });
            });
    }

    private static void MetaLabel(ColumnDescriptor column, string text, bool padded = false)
    {
        var item = column.Item();
        if (padded)
            item = item.PaddingTop(8);

        item.Text(text).FontSize(7).FontColor(Colors.Grey.Medium).Bold();
    }

    private static void MetaValue(ColumnDescriptor column, string text)
    {
        column.Item().PaddingTop(2).Text(text).FontSize(10).Bold().FontColor(Blue);
    }

    private static Action<IContainer> ComposeLineItems(SalesInvoiceDetailDto invoice)
    {
        return container => container.Column(column =>
        {
            column.Item().Text("LINE ITEMS").FontSize(9).Bold().FontColor(Blue);

            column.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(22);
                    columns.RelativeColumn(3);
                    columns.ConstantColumn(38);
                    columns.ConstantColumn(38);
                    columns.ConstantColumn(58);
                    columns.ConstantColumn(58);
                    columns.RelativeColumn(2);
                });

                static IContainer HeaderCell(IContainer cell) =>
                    cell.Background(Blue).Padding(5).AlignMiddle();

                table.Header(header =>
                {
                    void AddHeader(string label) =>
                        header.Cell().Element(HeaderCell).Text(label).FontSize(8).Bold().FontColor(Colors.White);

                    AddHeader("#");
                    AddHeader("Product");
                    AddHeader("Unit");
                    AddHeader("Qty");
                    AddHeader("Unit Price");
                    AddHeader("Amount");
                    AddHeader("Sales Order");
                });

                var items = invoice.Items.ToList();
                for (var index = 0; index < items.Count; index++)
                {
                    var item = items[index];
                    var background = index % 2 == 0 ? "#FFFFFF" : LightBlue;

                    IContainer DataCell(IContainer cell) =>
                        cell.Background(background)
                            .BorderBottom(1).BorderColor(BorderColor)
                            .Padding(5).AlignMiddle();

                    var amount = item.Quantity * (item.UnitPrice ?? 0m);

                    table.Cell().Element(DataCell).AlignCenter().Text((index + 1).ToString()).FontSize(8);
                    table.Cell().Element(DataCell).Text(item.ProductName).FontSize(8);
                    table.Cell().Element(DataCell).AlignCenter().Text(item.UnitShortName ?? "-").FontSize(8);
                    table.Cell().Element(DataCell).AlignRight().Text(item.Quantity.ToString("0.##")).FontSize(8);
                    table.Cell().Element(DataCell).AlignRight().Text((item.UnitPrice ?? 0m).ToString("0.00")).FontSize(8);
                    table.Cell().Element(DataCell).AlignRight().Text(amount.ToString("0.00")).FontSize(8);
                    table.Cell().Element(DataCell).Text(item.SalesOrderNumber ?? "-").FontSize(8);
                }
            });
        });
    }

    private static Action<IContainer> ComposeTotals(SalesInvoiceDetailDto invoice)
    {
        var subTotal = invoice.Items.Sum(item => item.Quantity * (item.UnitPrice ?? 0m));
        var taxAmount = subTotal * ((invoice.TaxPercentage ?? 0m) / 100m);
        var grandTotal = subTotal + taxAmount;

        return container => container.AlignRight().Width(220).Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn();
                columns.ConstantColumn(80);
            });

            void AddRow(string label, string value, bool highlight = false)
            {
                IContainer Cell(IContainer cell) =>
                    cell.Background(highlight ? LightBlue : Colors.White)
                        .BorderBottom(1).BorderColor(BorderColor)
                        .PaddingVertical(5).PaddingHorizontal(8)
                        .AlignMiddle();

                var labelCell = table.Cell().Element(Cell);
                var valueCell = table.Cell().Element(Cell).AlignRight();

                if (highlight)
                {
                    labelCell.Text(label).FontSize(9).Bold().FontColor(Blue);
                    valueCell.Text(value).FontSize(9).Bold().FontColor(Blue);
                }
                else
                {
                    labelCell.Text(label).FontSize(9);
                    valueCell.Text(value).FontSize(9);
                }
            }

            AddRow("Sub Total", subTotal.ToString("0.00"));
            AddRow($"Tax ({invoice.TaxPercentage ?? 0m:0.##}%)", taxAmount.ToString("0.00"));
            AddRow("Grand Total", grandTotal.ToString("0.00"), true);
        });
    }

    private static Action<IContainer> ComposeRemarks(string remarks)
    {
        return container => container.Column(column =>
        {
            column.Item().Text("REMARKS").FontSize(9).Bold().FontColor(Blue);
            column.Item().PaddingTop(6)
                .Background(Amber)
                .BorderLeft(4).BorderColor("#F4B942")
                .Padding(10)
                .Text(remarks).FontSize(9);
        });
    }
}
