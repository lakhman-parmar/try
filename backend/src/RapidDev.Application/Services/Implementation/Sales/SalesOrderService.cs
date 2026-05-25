using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Interfaces.Repositories.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.Application.Services.Implementation.Sales;

public class SalesOrderService : ISalesOrderService
{
    private readonly ISalesOrderRepository _repository;

    public SalesOrderService(ISalesOrderRepository repository)
    {
        _repository = repository;
    }

    public Task<PagedResult<SalesOrderListItemDto>> GetAllAsync(SalesOrderFilterDto filter)
    {
        return _repository.GetAllAsync(filter);
    }

    public Task<SalesOrderDetailDto?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public Task<IEnumerable<EstimationForSoDto>> GetEstimationsForSoAsync()
    {
        return _repository.GetEstimationsForSoAsync();
    }

    public Task<int> CreateAsync(CreateSalesOrderDto dto)
    {
        return _repository.CreateAsync(dto);
    }

    public Task<bool> UpdateAsync(int id, UpdateSalesOrderDto dto)
    {
        return _repository.UpdateAsync(id, dto);
    }

    public Task<bool> DeleteAsync(int id)
    {
        return _repository.DeleteAsync(id);
    }
}
