namespace RapidDev.Domain.Models;

public class SalesOrderItem
{
    public int SalesOrderItemId { get; set; }
    public int? SalesOrderId { get; set; }
    public int? ProductId { get; set; }
    public int? EstimationId { get; set; }
    public int? EstimationItemId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Estimation? Estimation { get; set; }
    public EstimationItem? EstimationItem { get; set; }
    public Product? Product { get; set; }
    public ICollection<SalesInvoiceItem> SalesInvoiceItems { get; set; } = new List<SalesInvoiceItem>();
    public SalesOrder? SalesOrder { get; set; }
}
