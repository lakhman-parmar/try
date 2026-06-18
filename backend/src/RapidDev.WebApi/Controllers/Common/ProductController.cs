using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Common;

namespace RapidDev.WebApi.Controllers.Common;

[ApiController]
[Route("api/products")]
[Authorize(Roles = "Admin")]
public class ProductController(IProductService _productService) : ControllerBase
{
    // ── Purchase-flow endpoints (used by PR/PO/Bill) ───────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? supplierId)
    {
        IEnumerable<ProductDto> products = await _productService.GetAllAsync(supplierId);
        return Ok(ApiResponse<IEnumerable<ProductDto>>.Success(products, "Products retrieved successfully."));
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
        return result
            ? Ok(ApiResponse<bool>.Success(true, "Product supplier mapping deleted successfully."))
            : BadRequest(ApiResponse<bool>.Failure("Failed to delete product supplier mapping."));
    }

    // ── Product CRUD ──────────────────────────────────────────────────────────

    [HttpGet("manage")]
    public async Task<IActionResult> GetAllPaged([FromQuery] ProductFilterDto filter)
    {
        PagedResult<ProductListItemDto> result = await _productService.GetProductsPagedAsync(filter);
        return Ok(ApiResponse<PagedResult<ProductListItemDto>>.Success(result));
    }

    [HttpGet("manage/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        ProductDetailDto? product = await _productService.GetProductByIdAsync(id);
        return product is null
            ? NotFound(ApiResponse<ProductDetailDto>.Failure("Product not found."))
            : Ok(ApiResponse<ProductDetailDto>.Success(product));
    }

    [HttpPost("manage")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        int newId = await _productService.CreateProductAsync(dto);
        return Ok(ApiResponse<int>.Success(newId, "Product created successfully."));
    }

    [HttpPut("manage/{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
        bool ok = await _productService.UpdateProductAsync(id, dto);
        return ok
            ? Ok(ApiResponse<bool>.Success(true, "Product updated successfully."))
            : BadRequest(ApiResponse<bool>.Failure("Failed to update product."));
    }

    [HttpDelete("manage/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        bool ok = await _productService.DeleteProductAsync(id);
        return ok
            ? Ok(ApiResponse<bool>.Success(true, "Product deleted successfully."))
            : BadRequest(ApiResponse<bool>.Failure("Failed to delete product."));
    }

    // ── Units ─────────────────────────────────────────────────────────────────

    [HttpGet("units")]
    public async Task<IActionResult> GetUnits()
    {
        IEnumerable<UnitDto> units = await _productService.GetAllUnitsAsync();
        return Ok(ApiResponse<IEnumerable<UnitDto>>.Success(units));
    }
}
