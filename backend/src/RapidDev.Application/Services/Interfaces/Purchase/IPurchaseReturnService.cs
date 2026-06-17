using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Purchase;

public interface IPurchaseReturnService
{
    Task<PagedResult<PurchaseReturnListItemDto>> GetAllAsync(PurchaseReturnFilterDto filter);
    Task<PurchaseReturnDetailDto?> GetByIdAsync(int id);
    Task<PagedResult<BillForReturnDto>> GetBillsForReturnAsync(int pageNumber, int pageSize);
    Task<int> CreateAsync(CreatePurchaseReturnDto dto);
}
