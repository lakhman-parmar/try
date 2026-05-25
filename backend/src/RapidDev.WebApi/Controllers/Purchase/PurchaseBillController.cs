using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.WebApi.Controllers.Purchase;

[ApiController]
[Route("api/purchase-bills")]
public class PurchaseBillController : ControllerBase
{
    private readonly IPurchaseBillService _service;

    public PurchaseBillController(IPurchaseBillService service)
    {
        _service = service;
    }

    // ── GET /api/purchase-bills?search=&fromDate=&toDate=&supplierId=&pageNumber=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PurchaseBillFilterDto filter)
    {
        var result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<PurchaseBillListItemDto>>.Success(result));
    }

    // ── GET /api/purchase-bills/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var bill = await _service.GetByIdAsync(id);
        if (bill is null)
            return NotFound(ApiResponse<string>.Failure("Purchase bill not found."));

        return Ok(ApiResponse<PurchaseBillDetailDto>.Success(bill));
    }

    // ── GET /api/purchase-bills/orders-for-bill
    /// <summary>
    /// Returns all purchase orders that have at least one unbilled item,
    /// so the UI can pre-fill items when creating a bill from POs.
    /// </summary>
    [HttpGet("orders-for-bill")]
    public async Task<IActionResult> GetOrdersForBill()
    {
        var result = await _service.GetOrdersForBillAsync();
        return Ok(ApiResponse<IEnumerable<PurchaseOrderForBillDto>>.Success(result));
    }

    // ── POST /api/purchase-bills
    /// <summary>
    /// Creates a new purchase bill. Items can be sourced from POs, requisitions,
    /// or added directly — all in the same request. Stock is updated immediately.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseBillDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(ApiResponse<string>.Failure("At least one item is required."));

        var newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { PurchaseBillId = newId }, "Purchase bill created and stock updated."));
    }

    // ── POST /api/purchase-bills/{id}/regenerate
    /// <summary>
    /// Creates a new purchase bill by cloning the items of an existing bill.
    /// The source bill is never modified. Stock is updated for the new bill.
    /// </summary>
    [HttpPost("{id:int}/regenerate")]
    public async Task<IActionResult> Regenerate(int id, [FromBody] RegeneratePurchaseBillDto dto)
    {
        var newId = await _service.RegenerateAsync(id, dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { PurchaseBillId = newId }, "Purchase bill regenerated and stock updated."));
    }
}
