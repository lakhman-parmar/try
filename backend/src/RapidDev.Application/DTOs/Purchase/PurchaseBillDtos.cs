namespace RapidDev.Application.DTOs.Purchase;

// ── Filter / Pagination ──────────────────────────────────────────────────────

public class PurchaseBillFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? SupplierId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ── List (paginated) ─────────────────────────────────────────────────────────

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

// ── Detail (single bill with items) ─────────────────────────────────────────

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

    // PO traceability — null when item was added directly
    public int? PurchaseOrderId { get; set; }
    public string? PoNumber { get; set; }
    public int? PurchaseOrderItemId { get; set; }

    // Requisition traceability — null when no requisition link exists
    public int? RequisitionId { get; set; }
    public string? RequisitionNo { get; set; }
    public int? RequisitionItemId { get; set; }
}

// ── POs available to pull into a new bill ────────────────────────────────────

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

    // Requisition traceability
    public int? RequisitionId { get; set; }
    public string? RequisitionNo { get; set; }
    public int? RequisitionItemId { get; set; }
}

// ── Create ───────────────────────────────────────────────────────────────────

public class CreatePurchaseBillDto
{
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseBillItemDto> Items { get; set; }
        = Enumerable.Empty<CreatePurchaseBillItemDto>();
}

public class CreatePurchaseBillItemDto
{
    public int ProductId { get; set; }

    /// <summary>Null when item is not sourced from a purchase order.</summary>
    public int? PurchaseOrderId { get; set; }

    /// <summary>Null when item is not sourced from a purchase order.</summary>
    public int? PurchaseOrderItemId { get; set; }

    public decimal Quantity { get; set; }

    // UnitPrice is intentionally omitted — always resolved from product.purchase_price in the SP.
}

// ── Regenerate (new bill from existing bill) ─────────────────────────────────

public class RegeneratePurchaseBillDto
{
    /// <summary>Override tax percentage for the regenerated bill. Null = inherit from source.</summary>
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
}