using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;

namespace RapidDev.Application.Services.Interfaces.Sales;

public interface ISalesOrderService
{
    Task<PagedResult<SalesOrderListItemDto>> GetAllAsync(SalesOrderFilterDto filter);
    Task<SalesOrderDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<EstimationForSoDto>> GetEstimationsForSoAsync(int customerId);
    Task<int> CreateAsync(CreateSalesOrderDto dto);
    Task<bool> UpdateAsync(int id, UpdateSalesOrderDto dto);
    Task<bool> DeleteAsync(int id);
}
