using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.WebApi.Controllers.Sales;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/sales-orders")]
public class SalesOrderController : ControllerBase
{
    private readonly ISalesOrderService _service;

    public SalesOrderController(ISalesOrderService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] SalesOrderFilterDto filter)
    {
        var errors = SalesValidation.ValidateFilter(filter.PageNumber, filter.PageSize, filter.FromDate, filter.ToDate, filter.Search);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid filter.", errors));

        var result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<SalesOrderListItemDto>>.Success(result));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _service.GetByIdAsync(id);
        if (order is null)
            return NotFound(ApiResponse<string>.Failure("Sales order not found."));

        return Ok(ApiResponse<SalesOrderDetailDto>.Success(order));
    }

    /// <summary>
    /// Returns all open estimations with their items so the UI can
    /// pre-fill / select items when creating a new sales order.
    /// </summary>
    [HttpGet("estimations-for-so")]
    public async Task<IActionResult> GetEstimationsForSo()
    {
        var result = await _service.GetEstimationsForSoAsync();
        return Ok(ApiResponse<IEnumerable<EstimationForSoDto>>.Success(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalesOrderDto dto)
    {
        var errors = SalesValidation.Validate(dto);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid sales order.", errors));

        var newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { SalesOrderId = newId }));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSalesOrderDto dto)
    {
        var errors = SalesValidation.Validate(dto);
        if (errors.Any())
            return BadRequest(ApiResponse<IEnumerable<string>>.Failure("Invalid sales order.", errors));

        var updated = await _service.UpdateAsync(id, dto);
        if (!updated)
            return NotFound(ApiResponse<string>.Failure("Sales order not found."));

        return Ok(ApiResponse<string>.Success("Sales order updated successfully."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound(ApiResponse<string>.Failure("Sales order not found."));

        return Ok(ApiResponse<string>.Success("Sales order deleted successfully."));
    }
}
