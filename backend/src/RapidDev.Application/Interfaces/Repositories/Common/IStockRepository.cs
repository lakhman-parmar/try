using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Stock;

namespace RapidDev.Application.Interfaces.Repositories.Stock;

public interface IStockRepository
{
    Task<PagedResult<StockListItemDto>> GetAllAsync(StockFilterDto filter);
    Task<StockDetailDto?>              GetByIdAsync(int productId);
}
