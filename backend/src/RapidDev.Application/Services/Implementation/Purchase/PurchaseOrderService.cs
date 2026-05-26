using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.Application.Services.Implementation.Purchase;

public class PurchaseOrderService(IPurchaseOrderRepository _repository) : IPurchaseOrderService
{
    public Task<PagedResult<PurchaseOrderListItemDto>> GetAllAsync(PurchaseOrderFilterDto filter)
    {
        return _repository.GetAllAsync(filter);
    }

    public Task<PurchaseOrderDetailDto?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public Task<IEnumerable<RequisitionForPoDto>> GetRequisitionsForPoAsync()
    {
        return _repository.GetRequisitionsForPoAsync();
    }

    public Task<int> CreateAsync(CreatePurchaseOrderDto dto)
    {
        return _repository.CreateAsync(dto);
    }

    public Task<bool> UpdateAsync(int id, UpdatePurchaseOrderDto dto)
    {
        return _repository.UpdateAsync(id, dto);
    }

    public Task<bool> DeleteAsync(int id)
    {
        return _repository.DeleteAsync(id);
    }
}
