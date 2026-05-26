namespace RapidDev.Application.DTOs.Stock;

public class StockFilterDto
{
    public string? Search     { get; set; }
    public int     PageNumber { get; set; } = 1;
    public int     PageSize   { get; set; } = 20;
}

public class StockListItemDto
{
    public int      ProductId     { get; set; }
    public string   Name          { get; set; } = null!;
    public string?  Description   { get; set; }
    public decimal? SellingPrice  { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? Stock         { get; set; }
    public string?  UnitShortName { get; set; }
}

public class StockDetailDto
{
    public int      ProductId     { get; set; }
    public string   Name          { get; set; } = null!;
    public string?  Description   { get; set; }
    public decimal? SellingPrice  { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? Stock         { get; set; }
    public string?  UnitShortName { get; set; }

    public IEnumerable<StockMovementDto> Movements { get; set; }
        = Enumerable.Empty<StockMovementDto>();
}

public class StockMovementDto
{
    public int      StockRecordId  { get; set; }
    public int      RecordType     { get; set; }   // 0 = Sales, 1 = Purchase
    public int      TransactionId  { get; set; }
    public decimal? QuantityChange { get; set; }
    public decimal? Price          { get; set; }
    public string?  Reason         { get; set; }
    public DateTime? CreatedAt     { get; set; }
}
