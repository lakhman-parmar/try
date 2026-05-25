namespace RapidDev.Domain.Models;

public class SalesInvoice
{
    public int SalesInvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public int? SalesOrderId { get; set; }
    public int? CustomerId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Customer? Customer { get; set; }
    public ICollection<SalesInvoiceItem> SalesInvoiceItems { get; set; } = new List<SalesInvoiceItem>();
    public SalesOrder? SalesOrder { get; set; }
}
