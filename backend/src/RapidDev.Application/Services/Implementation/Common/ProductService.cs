using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Common;
using RapidDev.Application.Services.Interfaces.Common;

namespace RapidDev.Application.Services.Implementation.Common;

public class ProductService(IProductRepository _productRepository) : IProductService
{
    public Task<IEnumerable<ProductDto>> GetAllAsync(int? supplierId = null)
        => _productRepository.GetAllAsync(supplierId);

    public Task<IEnumerable<SupplierDto>> GetSuppliersAsync()
        => _productRepository.GetSuppliersAsync();

    public Task<IEnumerable<SupplierProductDto>> GetSuppliersByProductAsync(int productId)
        => _productRepository.GetSuppliersByProductAsync(productId);

    public Task<int> UpsertSupplierProductAsync(UpsertSupplierProductDto dto)
        => _productRepository.UpsertSupplierProductAsync(dto);

    public Task<bool> DeleteSupplierProductAsync(int supplierProductId)
        => _productRepository.DeleteSupplierProductAsync(supplierProductId);

    public Task<PagedResult<ProductListItemDto>> GetProductsPagedAsync(ProductFilterDto filter)
        => _productRepository.GetProductsPagedAsync(filter);

    public Task<ProductDetailDto?> GetProductByIdAsync(int productId)
        => _productRepository.GetProductByIdAsync(productId);

    public Task<int> CreateProductAsync(CreateProductDto dto)
        => _productRepository.CreateProductAsync(dto);

    public Task<bool> UpdateProductAsync(int productId, UpdateProductDto dto)
        => _productRepository.UpdateProductAsync(productId, dto);

    public Task<bool> DeleteProductAsync(int productId)
        => _productRepository.DeleteProductAsync(productId);

    public Task<IEnumerable<UnitDto>> GetAllUnitsAsync()
        => _productRepository.GetAllUnitsAsync();
}
