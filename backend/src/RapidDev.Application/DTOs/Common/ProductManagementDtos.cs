namespace RapidDev.Application.DTOs.Common;

public class ProductFilterDto
{
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class ProductListItemDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? SellingPrice { get; set; }
    public decimal? MinPurchasePrice { get; set; }
    public decimal? Stock { get; set; }
    public int? UnitId { get; set; }
    public string? UnitShortName { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
}

public class ProductDetailDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? SellingPrice { get; set; }
    public decimal? Stock { get; set; }
    public int? UnitId { get; set; }
    public string? UnitShortName { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public IEnumerable<SupplierProductDto> Suppliers { get; set; } = Enumerable.Empty<SupplierProductDto>();
}

public class CreateProductDto
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? SellingPrice { get; set; }
    public int? UnitId { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdateProductDto
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? SellingPrice { get; set; }
    public int? UnitId { get; set; }
    public string? ImageUrl { get; set; }
}

public class UnitDto
{
    public int UnitId { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
}
