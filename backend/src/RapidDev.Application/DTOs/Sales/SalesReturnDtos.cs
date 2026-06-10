using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.DTOs.Sales;

public class SalesReturnFilterDto
{
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CustomerId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SalesReturnListItemDto
{
    public int SalesReturnId { get; set; }
    public string ReturnNumber { get; set; } = null!;
    public int? SalesInvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? Remarks { get; set; }
    public decimal? TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public decimal? SubTotal { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class SalesReturnDetailDto
{
    public int SalesReturnId { get; set; }
    public string ReturnNumber { get; set; } = null!;
    public int? SalesInvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? Remarks { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<SalesReturnItemDetailDto> Items { get; set; }
        = Enumerable.Empty<SalesReturnItemDetailDto>();
}

public class SalesReturnItemDetailDto
{
    public int SalesReturnItemId { get; set; }
    public int SalesInvoiceItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? SalesInvoiceId { get; set; }
}

public class SalesInvoiceForReturnDto
{
    public int SalesInvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? Remarks { get; set; }
    public DateTime? CreatedAt { get; set; }
    public IEnumerable<SalesInvoiceItemForReturnDto> Items { get; set; }
        = Enumerable.Empty<SalesInvoiceItemForReturnDto>();
}

public class SalesInvoiceItemForReturnDto
{
    public int SalesInvoiceItemId { get; set; }
    public int SalesInvoiceId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? UnitShortName { get; set; }
    public decimal Quantity { get; set; }
    public decimal ReturnedQuantity { get; set; }
    public decimal ReturnableQuantity { get; set; }
    public decimal? UnitPrice { get; set; }
}

public class CreateSalesReturnDto
{
    public int? SalesInvoiceId { get; set; }
    public int? CustomerId { get; set; }
    public string? Remarks { get; set; }
    public IEnumerable<CreateSalesReturnItemDto> Items { get; set; }
        = Enumerable.Empty<CreateSalesReturnItemDto>();
}

public class CreateSalesReturnItemDto
{
    public int ProductId { get; set; }
    public int SalesInvoiceId { get; set; }
    public int SalesInvoiceItemId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
}
