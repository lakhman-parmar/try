namespace RapidDev.Domain.Models;

public class PurchaseReturn
{
    public int PurchaseReturnId { get; set; }
    public string PurchaseReturnNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Supplier? Supplier { get; set; }
    public ICollection<PurchaseReturnItem> PurchaseReturnItems { get; set; } = new List<PurchaseReturnItem>();
}
