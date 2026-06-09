using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Services.Interfaces.Common;

namespace RapidDev.WebApi.Controllers.Common;

[ApiController]
[Route("api/products")]
[Authorize(Roles = "Admin")]
public class ProductController(IProductService _productService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        IEnumerable<ProductDto> products = await _productService.GetAllAsync();

        return Ok(
            ApiResponse<IEnumerable<object>>.Success(
                products.Cast<object>(),
                "Products retrieved successfully."
            )
        );
    }
}