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

    [HttpGet("{productId}/suppliers")]
    public async Task<IActionResult> GetProductSuppliers(int productId)
    {
        IEnumerable<SupplierProductDto> mappings = await _productService.GetSuppliersByProductAsync(productId);
        return Ok(ApiResponse<IEnumerable<SupplierProductDto>>.Success(mappings, "Product suppliers retrieved successfully."));
    }

    [HttpPost("suppliers")]
    public async Task<IActionResult> UpsertProductSupplier([FromBody] UpsertSupplierProductDto dto)
    {
        int mappingId = await _productService.UpsertSupplierProductAsync(dto);
        return Ok(ApiResponse<int>.Success(mappingId, "Product supplier mapping updated successfully."));
    }

    [HttpDelete("suppliers/{supplierProductId}")]
    public async Task<IActionResult> DeleteProductSupplier(int supplierProductId)
    {
        bool result = await _productService.DeleteSupplierProductAsync(supplierProductId);
        if (result)
        {
            return Ok(ApiResponse<bool>.Success(true, "Product supplier mapping deleted successfully."));
        }
        return BadRequest(ApiResponse<bool>.Failure("Failed to delete product supplier mapping."));
    }
}
