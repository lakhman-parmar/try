using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Services.Interfaces.Common;

namespace RapidDev.WebApi.Controllers.Common;

[ApiController]
[Route("api/products")]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await _productService.GetAllAsync();

        return Ok(
            ApiResponse<IEnumerable<object>>.Success(
                products.Cast<object>(),
                "Products retrieved successfully."
            )
        );
    }
}