using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Purchase;

public interface IPurchaseBillService
{
    Task<PagedResult<PurchaseBillListItemDto>> GetAllAsync(PurchaseBillFilterDto filter);
    Task<PurchaseBillDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<PurchaseOrderForBillDto>> GetOrdersForBillAsync();
    Task<int> CreateAsync(CreatePurchaseBillDto dto);
    Task<int> RegenerateAsync(int sourceBillId, RegeneratePurchaseBillDto dto);
}
