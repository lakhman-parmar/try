using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Interfaces.Repositories.Purchase;

public interface IPurchaseReturnRepository
{
    Task<PagedResult<PurchaseReturnListItemDto>> GetAllAsync(PurchaseReturnFilterDto filter);
    Task<PurchaseReturnDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<BillForReturnDto>> GetBillsForReturnAsync();
    Task<int> CreateAsync(CreatePurchaseReturnDto dto);
}
