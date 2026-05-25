using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;

namespace RapidDev.Application.Services.Interfaces.Sales;

public interface ISalesInvoiceService
{
    Task<PagedResult<SalesInvoiceListItemDto>> GetAllAsync(SalesInvoiceFilterDto filter);
    Task<SalesInvoiceDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<SalesOrderForInvoiceDto>> GetOrdersForInvoiceAsync();
    Task<int> CreateAsync(CreateSalesInvoiceDto dto);
    Task<int> RegenerateAsync(int sourceInvoiceId, RegenerateSalesInvoiceDto dto);
}
