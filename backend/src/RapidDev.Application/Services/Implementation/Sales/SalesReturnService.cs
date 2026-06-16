using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Interfaces.Repositories.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.Application.Services.Implementation.Sales;

public class SalesReturnService : ISalesReturnService
{
    private readonly ISalesReturnRepository _repository;

    public SalesReturnService(ISalesReturnRepository repository)
    {
        _repository = repository;
    }

    public Task<PagedResult<SalesReturnListItemDto>> GetAllAsync(SalesReturnFilterDto filter)
    {
        return _repository.GetAllAsync(filter);
    }

    public Task<SalesReturnDetailDto?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public Task<PagedResult<SalesInvoiceForReturnDto>> GetInvoicesForReturnAsync(int? customerId, int pageNumber, int pageSize)
    {
        return _repository.GetInvoicesForReturnAsync(customerId, pageNumber, pageSize);
    }

    public Task<int> CreateAsync(CreateSalesReturnDto dto)
    {
        return _repository.CreateAsync(dto);
    }
}
