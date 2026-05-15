namespace RapidDev.Domain.Models;

public class PurchaseBill
{
    public int PurchaseBillId { get; set; }
    public string BillNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public ICollection<PurchaseBillItem> PurchaseBillItems { get; set; } = new List<PurchaseBillItem>();
    public Supplier? Supplier { get; set; }
}
