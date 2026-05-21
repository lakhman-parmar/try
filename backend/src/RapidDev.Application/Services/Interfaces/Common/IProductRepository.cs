using RapidDev.Application.DTOs.Common;

namespace RapidDev.Application.Services.Interfaces.Common;

public interface IProductRepository
{
    Task<IEnumerable<ProductDto>> GetAllAsync();
}
