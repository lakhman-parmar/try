using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.Application.Services.Implementation.Purchase;

public class PurchaseReturnService(IPurchaseReturnRepository _repository) : IPurchaseReturnService
{
    public Task<PagedResult<PurchaseReturnListItemDto>> GetAllAsync(PurchaseReturnFilterDto filter)
        => _repository.GetAllAsync(filter);

    public Task<PurchaseReturnDetailDto?> GetByIdAsync(int id)
        => _repository.GetByIdAsync(id);

    public Task<IEnumerable<BillForReturnDto>> GetBillsForReturnAsync()
        => _repository.GetBillsForReturnAsync();

    public Task<int> CreateAsync(CreatePurchaseReturnDto dto)
        => _repository.CreateAsync(dto);
}
