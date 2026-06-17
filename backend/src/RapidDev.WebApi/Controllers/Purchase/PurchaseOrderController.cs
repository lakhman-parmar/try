using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.WebApi.Controllers.Purchase;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/purchase-orders")]
public class PurchaseOrderController(IPurchaseOrderService _service) : ControllerBase
{
    // GET /api/purchase-orders?search=&fromDate=&toDate=&supplierId=&pageNumber=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PurchaseOrderFilterDto filter)
    {
        List<string> errors = PurchaseValidation.ValidateFilter(filter.PageNumber, filter.PageSize, filter.FromDate, filter.ToDate, filter.Search);
        if (errors.Count != 0)
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid filter.", errors));

        PagedResult<PurchaseOrderListItemDto> result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<PurchaseOrderListItemDto>>.Success(result));
    }

    // GET /api/purchase-orders/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        PurchaseOrderDetailDto? order = await _service.GetByIdAsync(id);
        if (order is null)
            return NotFound(ApiResponse<string>.Failure("Purchase order not found."));

        return Ok(ApiResponse<PurchaseOrderDetailDto>.Success(order));
    }

    // GET /api/purchase-orders/requisitions-for-po?supplierId=&pageNumber=1&pageSize=20
    [HttpGet("requisitions-for-po")]
    public async Task<IActionResult> GetRequisitionsForPo([FromQuery] int supplierId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        if (supplierId <= 0)
            return BadRequest(ApiResponse<string>.Failure("Supplier is required."));

        PagedResult<RequisitionForPoDto> result = await _service.GetRequisitionsForPoAsync(supplierId, pageNumber, pageSize);
        return Ok(ApiResponse<PagedResult<RequisitionForPoDto>>.Success(result));
    }

    // POST /api/purchase-orders
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        List<string> errors = PurchaseValidation.Validate(dto);
        if (errors.Count != 0)
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid purchase order.", errors));

        int newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { PurchaseOrderId = newId }));
    }

    // PUT /api/purchase-orders/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePurchaseOrderDto dto)
    {
        List<string> errors = PurchaseValidation.Validate(dto);
        if (errors.Count != 0)
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid purchase order.", errors));

        bool updated = await _service.UpdateAsync(id, dto);
        if (!updated)
            return NotFound(ApiResponse<string>.Failure("Purchase order not found."));

        return Ok(ApiResponse<string>.Success("Purchase order updated successfully."));
    }

    // DELETE /api/purchase-orders/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        bool deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound(ApiResponse<string>.Failure("Purchase order not found."));

        return Ok(ApiResponse<string>.Success("Purchase order deleted successfully."));
    }
}
