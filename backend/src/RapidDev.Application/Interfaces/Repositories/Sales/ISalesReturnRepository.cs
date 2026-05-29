using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;

namespace RapidDev.Application.Interfaces.Repositories.Sales;

public interface ISalesReturnRepository
{
    Task<PagedResult<SalesReturnListItemDto>> GetAllAsync(SalesReturnFilterDto filter);
    Task<SalesReturnDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<SalesInvoiceForReturnDto>> GetInvoicesForReturnAsync();
    Task<int> CreateAsync(CreateSalesReturnDto dto);
}
