using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.WebApi.Controllers.Purchase;

[ApiController]
[Route("api/purchase-orders")]
public class PurchaseOrderController : ControllerBase
{
    private readonly IPurchaseOrderService _service;

    public PurchaseOrderController(IPurchaseOrderService service)
    {
        _service = service;
    }

    // ── GET /api/purchase-orders?search=&fromDate=&toDate=&supplierId=&pageNumber=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PurchaseOrderFilterDto filter)
    {
        var result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<PurchaseOrderListItemDto>>.Success(result));
    }

    // ── GET /api/purchase-orders/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _service.GetByIdAsync(id);
        if (order is null)
            return NotFound(ApiResponse<string>.Failure("Purchase order not found."));

        return Ok(ApiResponse<PurchaseOrderDetailDto>.Success(order));
    }

    // ── GET /api/purchase-orders/requisitions-for-po
    /// <summary>
    /// Returns all open requisitions with their items so the UI can
    /// pre-fill / select items when creating a new purchase order.
    /// </summary>
    [HttpGet("requisitions-for-po")]
    public async Task<IActionResult> GetRequisitionsForPo()
    {
        var result = await _service.GetRequisitionsForPoAsync();
        return Ok(ApiResponse<IEnumerable<RequisitionForPoDto>>.Success(result));
    }

    // ── POST /api/purchase-orders
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(ApiResponse<string>.Failure("At least one item is required."));

        var newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { PurchaseOrderId = newId }));
    }

    // ── PUT /api/purchase-orders/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePurchaseOrderDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(ApiResponse<string>.Failure("At least one item is required."));

        var updated = await _service.UpdateAsync(id, dto);
        if (!updated)
            return NotFound(ApiResponse<string>.Failure("Purchase order not found."));

        return Ok(ApiResponse<string>.Success("Purchase order updated successfully."));
    }

    // ── DELETE /api/purchase-orders/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound(ApiResponse<string>.Failure("Purchase order not found."));

        return Ok(ApiResponse<string>.Success("Purchase order deleted successfully."));
    }
}
