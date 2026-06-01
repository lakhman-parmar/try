using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Purchase;

public interface IPurchaseReturnService
{
    Task<PagedResult<PurchaseReturnListItemDto>> GetAllAsync(PurchaseReturnFilterDto filter);
    Task<PurchaseReturnDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<BillForReturnDto>> GetBillsForReturnAsync();
    Task<int> CreateAsync(CreatePurchaseReturnDto dto);
}
