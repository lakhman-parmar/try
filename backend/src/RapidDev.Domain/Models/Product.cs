namespace RapidDev.Domain.Models;

public class Product
{
    public int ProductId { get; set; }
    public string? ImageUrl { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? SellingPrice { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? Stock { get; set; }
    public int? UnitId { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public bool? IsDeleted { get; set; }

    public ICollection<EstimationItem> EstimationItems { get; set; } = new List<EstimationItem>();
    public ICollection<PriceHistory> PriceHistories { get; set; } = new List<PriceHistory>();
    public ICollection<PurchaseBillItem> PurchaseBillItems { get; set; } = new List<PurchaseBillItem>();
    public ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    public ICollection<PurchaseRequisitionItem> PurchaseRequisitionItems { get; set; } = new List<PurchaseRequisitionItem>();
    public ICollection<SalesInvoiceItem> SalesInvoiceItems { get; set; } = new List<SalesInvoiceItem>();
    public ICollection<SalesOrderItem> SalesOrderItems { get; set; } = new List<SalesOrderItem>();
    public ICollection<StockRecord> StockRecords { get; set; } = new List<StockRecord>();
    public ICollection<SupplierProduct> SupplierProducts { get; set; } = new List<SupplierProduct>();
    public Unit? Unit { get; set; }
}
