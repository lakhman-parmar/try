using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.DTOs.Sales;

public class EstimationFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CustomerId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class EstimationListItemDto
{
    public int EstimationId { get; set; }
    public string EstimationNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? Remarks { get; set; }
    public int ItemCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class EstimationDetailDto
{
    public int EstimationId { get; set; }
    public string EstimationNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<EstimationItemDetailDto> Items { get; set; } = Enumerable.Empty<EstimationItemDetailDto>();
}

public class EstimationItemDetailDto
{
    public int EstimationItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
}

public class CreateEstimationDto
{
    public int CustomerId { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreateEstimationItemDto> Items { get; set; } = Enumerable.Empty<CreateEstimationItemDto>();
}

public class CreateEstimationItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
}

public class UpdateEstimationDto
{
    public int? CustomerId { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreateEstimationItemDto> Items { get; set; } = Enumerable.Empty<CreateEstimationItemDto>();
}
