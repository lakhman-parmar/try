namespace RapidDev.Application.DTOs.Purchase;

public class PurchaseBillFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? SupplierId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PurchaseBillListItemDto
{
    public int PurchaseBillId { get; set; }
    public string BillNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public decimal? TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class PurchaseBillDetailDto
{
    public int PurchaseBillId { get; set; }
    public string BillNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<PurchaseBillItemDetailDto> Items { get; set; }
        = Enumerable.Empty<PurchaseBillItemDetailDto>();
}

public class PurchaseBillItemDetailDto
{
    public int PurchaseBillItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? PurchaseOrderId { get; set; }
    public string? PoNumber { get; set; }
    public int? PurchaseOrderItemId { get; set; }
    public int? RequisitionId { get; set; }
    public string? RequisitionNo { get; set; }
    public int? RequisitionItemId { get; set; }
}

public class PurchaseOrderForBillDto
{
    public int PurchaseOrderId { get; set; }
    public string PoNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public IEnumerable<PurchaseOrderItemForBillDto> Items { get; set; }
        = Enumerable.Empty<PurchaseOrderItemForBillDto>();
}

public class PurchaseOrderItemForBillDto
{
    public int PurchaseOrderItemId { get; set; }
    public int PurchaseOrderId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? RequisitionId { get; set; }
    public string? RequisitionNo { get; set; }
    public int? RequisitionItemId { get; set; }
}

public class CreatePurchaseBillDto
{
    public int? SupplierId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseBillItemDto> Items { get; set; }
        = Enumerable.Empty<CreatePurchaseBillItemDto>();
}

public class CreatePurchaseBillItemDto
{
    public int ProductId { get; set; }
    public int? PurchaseOrderId { get; set; }
    public int? PurchaseOrderItemId { get; set; }
    public decimal Quantity { get; set; }
}

public class RegeneratePurchaseBillDto
{
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
}
