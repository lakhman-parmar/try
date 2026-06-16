using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;

namespace RapidDev.Application.Interfaces.Repositories.Sales;

public interface ISalesOrderRepository
{
    Task<PagedResult<SalesOrderListItemDto>> GetAllAsync(SalesOrderFilterDto filter);
    Task<SalesOrderDetailDto?> GetByIdAsync(int id);
    Task<PagedResult<EstimationForSoDto>> GetEstimationsForSoAsync(int customerId, int pageNumber, int pageSize);
    Task<int> CreateAsync(CreateSalesOrderDto dto);
    Task<bool> UpdateAsync(int id, UpdateSalesOrderDto dto);
    Task<bool> DeleteAsync(int id);
}
