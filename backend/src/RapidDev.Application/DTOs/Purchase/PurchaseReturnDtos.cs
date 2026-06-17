namespace RapidDev.Application.DTOs.Purchase;

// ── Filter / query ────────────────────────────────────────────────────────────

public class PurchaseReturnFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? SupplierId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ── List response ─────────────────────────────────────────────────────────────

public class PurchaseReturnListItemDto
{
    public int PurchaseReturnId { get; set; }
    public string PurchaseReturnNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal? TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? BillNumber { get; set; }
}

// ── Detail response ───────────────────────────────────────────────────────────

public class PurchaseReturnDetailDto
{
    public int PurchaseReturnId { get; set; }
    public string PurchaseReturnNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<PurchaseReturnItemDetailDto> Items { get; set; }
        = Enumerable.Empty<PurchaseReturnItemDetailDto>();
}

public class PurchaseReturnItemDetailDto
{
    public int PurchaseReturnItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? PurchaseBillId { get; set; }
    public string? BillNumber { get; set; }
    public int? PurchaseBillItemId { get; set; }
}

// ── Bills-for-return lookup (used by frontend to populate return form) ────────

public class BillForReturnDto
{
    public int PurchaseBillId { get; set; }
    public string BillNumber { get; set; } = null!;
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public IEnumerable<BillItemForReturnDto> Items { get; set; }
        = Enumerable.Empty<BillItemForReturnDto>();
}

public class BillItemForReturnDto
{
    public int PurchaseBillItemId { get; set; }
    public int PurchaseBillId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal BilledQuantity { get; set; }
    public decimal ReturnedQuantity { get; set; }
    public decimal RemainingQuantity { get; set; }
    public decimal? UnitPrice { get; set; }
}

// ── Create request ────────────────────────────────────────────────────────────

public class CreatePurchaseReturnDto
{
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseReturnItemDto> Items { get; set; }
        = Enumerable.Empty<CreatePurchaseReturnItemDto>();
}

public class CreatePurchaseReturnItemDto
{
    public int ProductId { get; set; }
    public int PurchaseBillId { get; set; }
    public int PurchaseBillItemId { get; set; }
    public decimal Quantity { get; set; }
    // UnitPrice is optional; SP falls back to the original bill item price.
    public decimal? UnitPrice { get; set; }
}
