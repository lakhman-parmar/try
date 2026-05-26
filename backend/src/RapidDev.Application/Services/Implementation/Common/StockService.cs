using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Stock;
using RapidDev.Application.Interfaces.Repositories.Stock;
using RapidDev.Application.Services.Interfaces.Stock;

namespace RapidDev.Application.Services.Implementation.Stock;

public class StockService(IStockRepository _stockRepository) : IStockService
{
    public async Task<PagedResult<StockListItemDto>> GetAllAsync(StockFilterDto filter)
    {
        return await _stockRepository.GetAllAsync(filter);
    }

    public async Task<StockDetailDto?> GetByIdAsync(int productId)
    {
        return await _stockRepository.GetByIdAsync(productId);
    }
}
