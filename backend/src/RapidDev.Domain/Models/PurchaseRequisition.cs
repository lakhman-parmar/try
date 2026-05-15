namespace RapidDev.Domain.Models;

public class PurchaseRequisition
{
    public int PurchaseRequisitionId { get; set; }
    public string RequisitionNo { get; set; } = null!;
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    public ICollection<PurchaseRequisitionItem> PurchaseRequisitionItems { get; set; } = new List<PurchaseRequisitionItem>();
}
