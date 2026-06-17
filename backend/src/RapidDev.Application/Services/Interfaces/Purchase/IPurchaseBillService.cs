using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.Application.Services.Interfaces.Purchase;

public interface IPurchaseBillService
{
    Task<PagedResult<PurchaseBillListItemDto>> GetAllAsync(PurchaseBillFilterDto filter);
    Task<PurchaseBillDetailDto?> GetByIdAsync(int id);
    Task<PagedResult<PurchaseOrderForBillDto>> GetOrdersForBillAsync(int supplierId, int pageNumber = 1, int pageSize = 20);
    Task<int> CreateAsync(CreatePurchaseBillDto dto);
    Task<int> RegenerateAsync(int sourceBillId, RegeneratePurchaseBillDto dto);
}
