namespace RapidDev.Domain.Models;

public class PurchaseOrderItem
{
    public int PurchaseOrderItemId { get; set; }
    public int? PurchaseOrderId { get; set; }
    public int? ProductId { get; set; }
    public int? RequisitionId { get; set; }
    public int? RequisitionItemId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Product? Product { get; set; }
    public ICollection<PurchaseBillItem> PurchaseBillItems { get; set; } = new List<PurchaseBillItem>();
    public PurchaseOrder? PurchaseOrder { get; set; }
    public PurchaseRequisition? Requisition { get; set; }
    public PurchaseRequisitionItem? RequisitionItem { get; set; }
}
