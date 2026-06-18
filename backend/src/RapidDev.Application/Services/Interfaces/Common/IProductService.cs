using RapidDev.Application.DTOs.Common;

namespace RapidDev.Application.Services.Interfaces.Common;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync(int? supplierId = null);
    Task<IEnumerable<SupplierDto>> GetSuppliersAsync();
    Task<IEnumerable<SupplierProductDto>> GetSuppliersByProductAsync(int productId);
    Task<int> UpsertSupplierProductAsync(UpsertSupplierProductDto dto);
    Task<bool> DeleteSupplierProductAsync(int supplierProductId);
}
