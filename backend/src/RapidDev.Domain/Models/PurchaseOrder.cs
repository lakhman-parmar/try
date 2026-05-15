namespace RapidDev.Domain.Models;

public class PurchaseOrder
{
    public int PurchaseOrderId { get; set; }
    public string PoNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public ICollection<PurchaseBillItem> PurchaseBillItems { get; set; } = new List<PurchaseBillItem>();
    public ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    public Supplier? Supplier { get; set; }
}
