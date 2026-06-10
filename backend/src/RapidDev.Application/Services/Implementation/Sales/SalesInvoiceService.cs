using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Interfaces.Repositories.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.Application.Services.Implementation.Sales;

public class SalesInvoiceService : ISalesInvoiceService
{
    private readonly ISalesInvoiceRepository _repository;

    public SalesInvoiceService(ISalesInvoiceRepository repository)
    {
        _repository = repository;
    }

    public Task<PagedResult<SalesInvoiceListItemDto>> GetAllAsync(SalesInvoiceFilterDto filter)
    {
        return _repository.GetAllAsync(filter);
    }

    public Task<SalesInvoiceDetailDto?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public Task<IEnumerable<SalesOrderForInvoiceDto>> GetOrdersForInvoiceAsync(int customerId)
    {
        return _repository.GetOrdersForInvoiceAsync(customerId);
    }

    public Task<int> CreateAsync(CreateSalesInvoiceDto dto)
    {
        return _repository.CreateAsync(dto);
    }

    public Task<int> RegenerateAsync(int sourceInvoiceId, RegenerateSalesInvoiceDto dto)
    {
        return _repository.RegenerateAsync(sourceInvoiceId, dto);
    }
}
