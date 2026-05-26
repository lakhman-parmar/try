using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.Application.Services.Implementation.Purchase;

public class PurchaseBillService(IPurchaseBillRepository _repository) : IPurchaseBillService
{
    public Task<PagedResult<PurchaseBillListItemDto>> GetAllAsync(PurchaseBillFilterDto filter)
    {
        return _repository.GetAllAsync(filter);
    }

    public Task<PurchaseBillDetailDto?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public Task<IEnumerable<PurchaseOrderForBillDto>> GetOrdersForBillAsync()
    {
        return _repository.GetOrdersForBillAsync();
    }

    public Task<int> CreateAsync(CreatePurchaseBillDto dto)
    {
        return _repository.CreateAsync(dto);
    }

    public Task<int> RegenerateAsync(int sourceBillId, RegeneratePurchaseBillDto dto)
    {
        return _repository.RegenerateAsync(sourceBillId, dto);
    }
}
