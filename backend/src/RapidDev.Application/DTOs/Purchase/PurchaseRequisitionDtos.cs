namespace RapidDev.Application.DTOs.Purchase;

public class PurchaseRequisitionFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PurchaseRequisitionListItemDto
{
    public int PurchaseRequisitionId { get; set; }
    public string RequisitionNo { get; set; } = null!;
    public string? Remarks { get; set; }
    public int ItemCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class PurchaseRequisitionDetailDto
{
    public int PurchaseRequisitionId { get; set; }
    public string RequisitionNo { get; set; } = null!;
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<PurchaseRequisitionItemDetailDto> Items { get; set; } = Enumerable.Empty<PurchaseRequisitionItemDetailDto>();
}

public class PurchaseRequisitionItemDetailDto
{
    public int PurchaseRequisitionItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
}

public class CreatePurchaseRequisitionDto
{
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseRequisitionItemDto> Items { get; set; } = Enumerable.Empty<CreatePurchaseRequisitionItemDto>();
}

public class CreatePurchaseRequisitionItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
}

public class UpdatePurchaseRequisitionDto
{
    public string? Remarks { get; set; }
    public IEnumerable<CreatePurchaseRequisitionItemDto> Items { get; set; } = Enumerable.Empty<CreatePurchaseRequisitionItemDto>();
}
