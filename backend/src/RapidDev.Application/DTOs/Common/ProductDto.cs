namespace RapidDev.Application.DTOs.Common;

public class ProductDto
{
    public int ProductId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal? SellingPrice { get; set; }

    public decimal? PurchasePrice { get; set; }

    public decimal? Stock { get; set; }

    public string? UnitShortName { get; set; }
}

public class SupplierDto
{
    public int SupplierId { get; set; }
    public string Name { get; set; } = null!;
}
