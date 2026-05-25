using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.DTOs.Sales;

public class SalesInvoiceFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CustomerId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SalesInvoiceListItemDto
{
    public int SalesInvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public int? SalesOrderId { get; set; }
    public string? SalesOrderNumber { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public decimal? TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public decimal? SubTotal { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class SalesInvoiceDetailDto
{
    public int SalesInvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public int? SalesOrderId { get; set; }
    public string? SalesOrderNumber { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<SalesInvoiceItemDetailDto> Items { get; set; }
        = Enumerable.Empty<SalesInvoiceItemDetailDto>();
}

public class SalesInvoiceItemDetailDto
{
    public int SalesInvoiceItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? SalesOrderId { get; set; }
    public string? SalesOrderNumber { get; set; }
    public int? SalesOrderItemId { get; set; }
}

public class SalesOrderForInvoiceDto
{
    public int SalesOrderId { get; set; }
    public string SalesOrderNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public IEnumerable<SalesOrderItemForInvoiceDto> Items { get; set; }
        = Enumerable.Empty<SalesOrderItemForInvoiceDto>();
}

public class SalesOrderItemForInvoiceDto
{
    public int SalesOrderItemId { get; set; }
    public int SalesOrderId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? AvailableStock { get; set; }
    public int? EstimationId { get; set; }
    public string? EstimationNumber { get; set; }
    public int? EstimationItemId { get; set; }
}

public class CreateSalesInvoiceDto
{
    public int? CustomerId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreateSalesInvoiceItemDto> Items { get; set; }
        = Enumerable.Empty<CreateSalesInvoiceItemDto>();
}

public class CreateSalesInvoiceItemDto
{
    public int ProductId { get; set; }
    public int? SalesOrderId { get; set; }
    public int? SalesOrderItemId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
}

public class RegenerateSalesInvoiceDto
{
    public decimal? TaxPercentage { get; set; }
    public string? Remarks { get; set; }
}
