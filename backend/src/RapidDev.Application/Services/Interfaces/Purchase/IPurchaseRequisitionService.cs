using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Purchase;

public interface IPurchaseRequisitionService
{
    Task<PagedResult<PurchaseRequisitionListItemDto>> GetAllAsync(PurchaseRequisitionFilterDto filter);
    Task<PurchaseRequisitionDetailDto?> GetByIdAsync(int id);
    Task<int> CreateAsync(CreatePurchaseRequisitionDto dto);
    Task<bool> UpdateAsync(int id, UpdatePurchaseRequisitionDto dto);
    Task<bool> DeleteAsync(int id);
}
