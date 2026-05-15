namespace RapidDev.Domain.Models;

public class Supplier
{
    public int SupplierId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public ICollection<PurchaseBill> PurchaseBills { get; set; } = new List<PurchaseBill>();
    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    public ICollection<SupplierProduct> SupplierProducts { get; set; } = new List<SupplierProduct>();
}
