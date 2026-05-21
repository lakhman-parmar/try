using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Services.Interfaces.Common;

namespace RapidDev.Application.Services.Implementation.Common;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<IEnumerable<ProductDto>> GetAllAsync()
    {
        return await _productRepository.GetAllAsync();
    }
}