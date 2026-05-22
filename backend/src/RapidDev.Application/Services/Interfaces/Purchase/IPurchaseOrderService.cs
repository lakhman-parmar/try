using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Purchase;

public interface IPurchaseOrderService
{
    Task<PagedResult<PurchaseOrderListItemDto>> GetAllAsync(PurchaseOrderFilterDto filter);
    Task<PurchaseOrderDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<RequisitionForPoDto>> GetRequisitionsForPoAsync();
    Task<int> CreateAsync(CreatePurchaseOrderDto dto);
    Task<bool> UpdateAsync(int id, UpdatePurchaseOrderDto dto);
    Task<bool> DeleteAsync(int id);
}
