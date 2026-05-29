namespace RapidDev.Domain.Models;

public class SalesReturnItem
{
    public int SalesReturnItemId { get; set; }
    public int? SalesReturnId { get; set; }
    public int? SalesInvoiceId { get; set; }
    public int? SalesInvoiceItemId { get; set; }
    public int? ProductId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Product? Product { get; set; }
    public SalesReturn? SalesReturn { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public SalesInvoiceItem? SalesInvoiceItem { get; set; }
}
