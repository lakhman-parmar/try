using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Interfaces.Repositories.Common;
using RapidDev.Application.Services.Interfaces.Common;

namespace RapidDev.Application.Services.Implementation.Common;

public class ProductService(IProductRepository _productRepository) : IProductService
{
    public async Task<IEnumerable<ProductDto>> GetAllAsync(int? supplierId = null)
    {
        return await _productRepository.GetAllAsync(supplierId);
    }

    public async Task<IEnumerable<SupplierDto>> GetSuppliersAsync()
    {
        return await _productRepository.GetSuppliersAsync();
    }
}
