using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Interfaces.Repositories.Purchase;

public interface IPurchaseReturnRepository
{
    Task<PagedResult<PurchaseReturnListItemDto>> GetAllAsync(PurchaseReturnFilterDto filter);
    Task<PurchaseReturnDetailDto?> GetByIdAsync(int id);
    Task<PagedResult<BillForReturnDto>> GetBillsForReturnAsync(int pageNumber, int pageSize);
    Task<int> CreateAsync(CreatePurchaseReturnDto dto);
}
