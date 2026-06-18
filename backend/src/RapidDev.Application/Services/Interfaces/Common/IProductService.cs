using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Common;

public interface IProductService
{
    // Purchase-flow
    Task<IEnumerable<ProductDto>> GetAllAsync(int? supplierId = null);
    Task<IEnumerable<SupplierDto>> GetSuppliersAsync();
    Task<IEnumerable<SupplierProductDto>> GetSuppliersByProductAsync(int productId);
    Task<int> UpsertSupplierProductAsync(UpsertSupplierProductDto dto);
    Task<bool> DeleteSupplierProductAsync(int supplierProductId);

    // Product CRUD
    Task<PagedResult<ProductListItemDto>> GetProductsPagedAsync(ProductFilterDto filter);
    Task<ProductDetailDto?> GetProductByIdAsync(int productId);
    Task<int> CreateProductAsync(CreateProductDto dto);
    Task<bool> UpdateProductAsync(int productId, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(int productId);

    // Units
    Task<IEnumerable<UnitDto>> GetAllUnitsAsync();
}
