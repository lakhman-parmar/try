namespace RapidDev.Application.DTOs.Purchase;
public class PurchaseOrderFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? SupplierId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PurchaseOrderListItemDto
{
    public int PurchaseOrderId { get; set; }
    public string PoNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public int ItemCount { get; set; }
    public decimal? SubTotal { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class PurchaseOrderDetailDto
{
    public int PurchaseOrderId { get; set; }
    public string PoNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<PurchaseOrderItemDetailDto> Items { get; set; }
        = Enumerable.Empty<PurchaseOrderItemDetailDto>();
}

public class PurchaseOrderItemDetailDto
{
    public int PurchaseOrderItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? RequisitionId { get; set; }
    public string? RequisitionNo { get; set; }
    public int? RequisitionItemId { get; set; }
}

public class RequisitionForPoDto
{
    public int PurchaseRequisitionId { get; set; }
    public string RequisitionNo { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public IEnumerable<RequisitionItemForPoDto> Items { get; set; }
        = Enumerable.Empty<RequisitionItemForPoDto>();
}

public class RequisitionItemForPoDto
{
    public int PurchaseRequisitionItemId { get; set; }
    public int RequisitionId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
}

public class CreatePurchaseOrderDto
{
    public int? SupplierId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseOrderItemDto> Items { get; set; }
        = Enumerable.Empty<CreatePurchaseOrderItemDto>();
}

public class CreatePurchaseOrderItemDto
{
    public int ProductId { get; set; }
    public int? RequisitionId { get; set; }
    public int? RequisitionItemId { get; set; }
    public decimal Quantity { get; set; }
}

// ── Update ───────────────────────────────────────────────────────────────────

public class UpdatePurchaseOrderDto
{
    public int? SupplierId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseOrderItemDto> Items { get; set; }
        = Enumerable.Empty<CreatePurchaseOrderItemDto>();
}
