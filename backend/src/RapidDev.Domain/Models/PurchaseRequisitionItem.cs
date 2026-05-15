namespace RapidDev.Domain.Models;

public class PurchaseRequisitionItem
{
    public int PurchaseRequisitionItemId { get; set; }
    public int? RequisitionId { get; set; }
    public int? ProductId { get; set; }
    public decimal? Quantity { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Product? Product { get; set; }
    public ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    public PurchaseRequisition? Requisition { get; set; }
}
