using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.WebApi.Controllers.Sales;

[ApiController]
[Route("api/sales-returns")]
public class SalesReturnController : ControllerBase
{
    private readonly ISalesReturnService _service;

    public SalesReturnController(ISalesReturnService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] SalesReturnFilterDto filter)
    {
        var result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<SalesReturnListItemDto>>.Success(result));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var salesReturn = await _service.GetByIdAsync(id);
        if (salesReturn is null)
            return NotFound(ApiResponse<string>.Failure("Sales return not found."));

        return Ok(ApiResponse<SalesReturnDetailDto>.Success(salesReturn));
    }

    [HttpGet("invoices-for-return")]
    public async Task<IActionResult> GetInvoicesForReturn()
    {
        var result = await _service.GetInvoicesForReturnAsync();
        return Ok(ApiResponse<IEnumerable<SalesInvoiceForReturnDto>>.Success(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalesReturnDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(ApiResponse<string>.Failure("At least one item is required."));

        var newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { SalesReturnId = newId }, "Sales return created and stock restored."));
    }
}
