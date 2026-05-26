using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Stock;
using RapidDev.Application.Services.Interfaces.Stock;

namespace RapidDev.WebApi.Controllers.Stock;

// [Authorize]
[ApiController]
[Route("api/stock")]
public class StockController(IStockService _stockService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] StockFilterDto filter)
    {
        PagedResult<StockListItemDto> result = await _stockService.GetAllAsync(filter);

        return Ok(
            ApiResponse<PagedResult<StockListItemDto>>.Success(
                result,
                "Stock retrieved successfully."
            )
        );
    }

    [HttpGet("{productId:int}")]
    public async Task<IActionResult> GetById(int productId)
    {
        StockDetailDto? result = await _stockService.GetByIdAsync(productId);

        if (result is null)
            return NotFound(
                ApiResponse<StockDetailDto>.Failure("Product not found.")
            );

        return Ok(
            ApiResponse<StockDetailDto>.Success(
                result,
                "Stock detail retrieved successfully."
            )
        );
    }
}
