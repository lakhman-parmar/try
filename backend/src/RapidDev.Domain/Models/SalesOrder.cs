namespace RapidDev.Domain.Models;

public class SalesOrder
{
    public int SalesOrderId { get; set; }
    public string SalesOrderNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Customer? Customer { get; set; }
    public ICollection<SalesInvoiceItem> SalesInvoiceItems { get; set; } = new List<SalesInvoiceItem>();
    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();
    public ICollection<SalesOrderItem> SalesOrderItems { get; set; } = new List<SalesOrderItem>();
}
