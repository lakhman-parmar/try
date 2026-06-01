namespace RapidDev.Domain.Models;

public class PurchaseReturnItem
{
    public int PurchaseReturnItemId { get; set; }
    public int? PurchaseReturnId { get; set; }
    public int? ProductId { get; set; }
    public int? PurchaseBillId { get; set; }
    public int? PurchaseBillItemId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public PurchaseReturn? PurchaseReturn { get; set; }
    public Product? Product { get; set; }
    public PurchaseBill? PurchaseBill { get; set; }
    public PurchaseBillItem? PurchaseBillItem { get; set; }
}
