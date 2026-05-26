using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Interfaces.Repositories.Common;
using RapidDev.Application.Services.Interfaces.Common;

namespace RapidDev.Application.Services.Implementation.Common;

public class ProductService(IProductRepository _productRepository) : IProductService
{
    public async Task<IEnumerable<ProductDto>> GetAllAsync()
    {
        return await _productRepository.GetAllAsync();
    }
}