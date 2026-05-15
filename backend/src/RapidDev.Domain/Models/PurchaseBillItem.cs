namespace RapidDev.Domain.Models;

public class PurchaseBillItem
{
    public int PurchaseBillItemId { get; set; }
    public int? PurchaseBillId { get; set; }
    public int? ProductId { get; set; }
    public int? PurchaseOrderId { get; set; }
    public int? PurchaseOrderItemId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Product? Product { get; set; }
    public PurchaseBill? PurchaseBill { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    public PurchaseOrderItem? PurchaseOrderItem { get; set; }
}
