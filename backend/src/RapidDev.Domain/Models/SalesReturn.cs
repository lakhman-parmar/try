namespace RapidDev.Domain.Models;

public class SalesReturn
{
    public int SalesReturnId { get; set; }
    public string ReturnNumber { get; set; } = null!;
    public int? SalesInvoiceId { get; set; }
    public int? CustomerId { get; set; }
    public string? Remarks { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Customer? Customer { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public ICollection<SalesReturnItem> SalesReturnItems { get; set; } = new List<SalesReturnItem>();
}
