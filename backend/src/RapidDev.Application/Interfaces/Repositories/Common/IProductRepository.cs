using RapidDev.Application.DTOs.Common;

namespace RapidDev.Application.Interfaces.Repositories.Common;

public interface IProductRepository
{
    Task<IEnumerable<ProductDto>> GetAllAsync();
}
