namespace RapidDev.Application.DTOs.Purchase;

// ── Filter / Pagination ──────────────────────────────────────────────────────

public class PurchaseOrderFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? SupplierId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ── List (paginated) ─────────────────────────────────────────────────────────

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

// ── Detail (single PO with items) ───────────────────────────────────────────

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

    // Requisition traceability — null when item was added directly
    public int? RequisitionId { get; set; }
    public string? RequisitionNo { get; set; }
    public int? RequisitionItemId { get; set; }
}

// ── Requisitions available to pull into a new PO ────────────────────────────

public class RequisitionForPoDto
{
    public int PurchaseRequisitionId { get; set; }
    public string RequisitionNo { get; set; } = null!;
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
    // UnitPrice omitted — always sourced from product.purchase_price in the SP
}

// ── Create ───────────────────────────────────────────────────────────────────

public class CreatePurchaseOrderDto
{
    // SupplierId is intentionally omitted — it is resolved automatically
    // in the stored procedure from the supplier_product mapping of the
    // selected items. All items must belong to the same supplier.
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseOrderItemDto> Items { get; set; }
        = Enumerable.Empty<CreatePurchaseOrderItemDto>();
}

public class CreatePurchaseOrderItemDto
{
    public int ProductId { get; set; }

    /// <summary>Null when item is not sourced from a requisition.</summary>
    public int? RequisitionId { get; set; }

    /// <summary>Null when item is not sourced from a requisition.</summary>
    public int? RequisitionItemId { get; set; }

    public decimal Quantity { get; set; }
    // UnitPrice intentionally omitted — always read from product.purchase_price in the SP
}

// ── Update ───────────────────────────────────────────────────────────────────

public class UpdatePurchaseOrderDto
{
    // SupplierId is intentionally omitted — resolved automatically from items.
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseOrderItemDto> Items { get; set; }
        = Enumerable.Empty<CreatePurchaseOrderItemDto>();
}