using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.DTOs.Sales;

public class SalesOrderFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CustomerId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SalesOrderListItemDto
{
    public int SalesOrderId { get; set; }
    public string SalesOrderNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public int ItemCount { get; set; }
    public decimal? SubTotal { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class SalesOrderDetailDto
{
    public int SalesOrderId { get; set; }
    public string SalesOrderNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<SalesOrderItemDetailDto> Items { get; set; }
        = Enumerable.Empty<SalesOrderItemDetailDto>();
}

public class SalesOrderItemDetailDto
{
    public int SalesOrderItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }

    public int? EstimationId { get; set; }
    public string? EstimationNumber { get; set; }
    public int? EstimationItemId { get; set; }
}

public class EstimationForSoDto
{
    public int EstimationId { get; set; }
    public string EstimationNumber { get; set; } = null!;
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public IEnumerable<EstimationItemForSoDto> Items { get; set; }
        = Enumerable.Empty<EstimationItemForSoDto>();
}

public class EstimationItemForSoDto
{
    public int EstimationItemId { get; set; }
    public int EstimationId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
}

public class CreateSalesOrderDto
{
    public int? CustomerId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreateSalesOrderItemDto> Items { get; set; }
        = Enumerable.Empty<CreateSalesOrderItemDto>();
}

public class CreateSalesOrderItemDto
{
    public int ProductId { get; set; }
    public int? EstimationId { get; set; }
    public int? EstimationItemId { get; set; }
    public decimal Quantity { get; set; }
}

public class UpdateSalesOrderDto
{
    public int? CustomerId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreateSalesOrderItemDto> Items { get; set; }
        = Enumerable.Empty<CreateSalesOrderItemDto>();
}
