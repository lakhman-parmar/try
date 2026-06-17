using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Interfaces.Repositories.Purchase;

public interface IPurchaseOrderRepository
{
    Task<PagedResult<PurchaseOrderListItemDto>> GetAllAsync(PurchaseOrderFilterDto filter);
    Task<PurchaseOrderDetailDto?> GetByIdAsync(int id);
    Task<PagedResult<RequisitionForPoDto>> GetRequisitionsForPoAsync(int supplierId, int pageNumber = 1, int pageSize = 20);
    Task<int> CreateAsync(CreatePurchaseOrderDto dto);
    Task<bool> UpdateAsync(int id, UpdatePurchaseOrderDto dto);
    Task<bool> DeleteAsync(int id);
}
