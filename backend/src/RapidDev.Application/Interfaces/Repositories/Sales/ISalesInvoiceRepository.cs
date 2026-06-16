using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;

namespace RapidDev.Application.Interfaces.Repositories.Sales;

public interface ISalesInvoiceRepository
{
    Task<PagedResult<SalesInvoiceListItemDto>> GetAllAsync(SalesInvoiceFilterDto filter);
    Task<SalesInvoiceDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<SalesOrderForInvoiceDto>> GetOrdersForInvoiceAsync(int customerId);
    Task<int> CreateAsync(CreateSalesInvoiceDto dto);
    Task<int> RegenerateAsync(int sourceInvoiceId, RegenerateSalesInvoiceDto dto);
}
