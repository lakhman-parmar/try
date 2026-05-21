using RapidDev.Application.DTOs.Common;

namespace RapidDev.Application.Services.Interfaces.Common;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync();
}