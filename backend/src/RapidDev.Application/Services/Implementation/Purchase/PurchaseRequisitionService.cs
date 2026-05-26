using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.Application.Services.Implementation.Purchase;

public class PurchaseRequisitionService(IPurchaseRequisitionRepository _repository) : IPurchaseRequisitionService
{
    public Task<PagedResult<PurchaseRequisitionListItemDto>> GetAllAsync(PurchaseRequisitionFilterDto filter)
    {
        return _repository.GetAllAsync(filter);
    }

    public Task<PurchaseRequisitionDetailDto?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public Task<int> CreateAsync(CreatePurchaseRequisitionDto dto)
    {
        return _repository.CreateAsync(dto);
    }

    public Task<bool> UpdateAsync(int id, UpdatePurchaseRequisitionDto dto)
    {
        return _repository.UpdateAsync(id, dto);
    }

    public Task<bool> DeleteAsync(int id)
    {
        return _repository.DeleteAsync(id);
    }
}
