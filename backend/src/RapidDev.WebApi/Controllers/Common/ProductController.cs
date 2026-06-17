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
    public async Task<IActionResult> GetAll([FromQuery] int? supplierId)
    {
        IEnumerable<ProductDto> products = await _productService.GetAllAsync(supplierId);

        return Ok(
            ApiResponse<IEnumerable<ProductDto>>.Success(
                products,
                "Products retrieved successfully."
            )
        );
    }

    [HttpGet("suppliers")]
    public async Task<IActionResult> GetSuppliers()
    {
        IEnumerable<SupplierDto> suppliers = await _productService.GetSuppliersAsync();
        return Ok(ApiResponse<IEnumerable<SupplierDto>>.Success(suppliers));
    }
}
