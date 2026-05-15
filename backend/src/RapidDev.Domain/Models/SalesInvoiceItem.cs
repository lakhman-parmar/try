namespace RapidDev.Domain.Models;

public class SalesInvoiceItem
{
    public int SalesInvoiceItemId { get; set; }
    public int? SalesInvoiceId { get; set; }
    public int? ProductId { get; set; }
    public int? SalesOrderId { get; set; }
    public int? SalesOrderItemId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Product? Product { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public SalesOrderItem? SalesOrderItem { get; set; }
}
