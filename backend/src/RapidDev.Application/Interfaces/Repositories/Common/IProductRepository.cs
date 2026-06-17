using RapidDev.Application.DTOs.Common;

namespace RapidDev.Application.Interfaces.Repositories.Common;

public interface IProductRepository
{
    Task<IEnumerable<ProductDto>> GetAllAsync(int? supplierId = null);
    Task<IEnumerable<SupplierDto>> GetSuppliersAsync();
}
