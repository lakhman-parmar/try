using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Stock;

namespace RapidDev.Application.Services.Interfaces.Stock;

public interface IStockService
{
    Task<PagedResult<StockListItemDto>> GetAllAsync(StockFilterDto filter);
    Task<StockDetailDto?>              GetByIdAsync(int productId);
}
