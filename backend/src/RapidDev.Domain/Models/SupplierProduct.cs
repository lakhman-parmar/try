namespace RapidDev.Domain.Models;

public class SupplierProduct
{
    public int SupplierProductId { get; set; }
    public int? ProductId { get; set; }
    public int? SupplierId { get; set; }
    public decimal? PurchasePrice { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public Product? Product { get; set; }
    public Supplier? Supplier { get; set; }
}
