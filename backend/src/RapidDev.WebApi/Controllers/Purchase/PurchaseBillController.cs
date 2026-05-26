using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.WebApi.Controllers.Purchase;

[ApiController]
[Route("api/purchase-bills")]
public class PurchaseBillController(IPurchaseBillService _service) : ControllerBase
{
    // GET /api/purchase-bills?search=&fromDate=&toDate=&supplierId=&pageNumber=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PurchaseBillFilterDto filter)
    {
        PagedResult<PurchaseBillListItemDto> result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<PurchaseBillListItemDto>>.Success(result));
    }

    // GET /api/purchase-bills/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        PurchaseBillDetailDto? bill = await _service.GetByIdAsync(id);
        if (bill is null)
            return NotFound(ApiResponse<string>.Failure("Purchase bill not found."));

        return Ok(ApiResponse<PurchaseBillDetailDto>.Success(bill));
    }

    // GET /api/purchase-bills/orders-for-bill
    [HttpGet("orders-for-bill")]
    public async Task<IActionResult> GetOrdersForBill()
    {
        IEnumerable<PurchaseOrderForBillDto> result = await _service.GetOrdersForBillAsync();
        return Ok(ApiResponse<IEnumerable<PurchaseOrderForBillDto>>.Success(result));
    }

    // POST /api/purchase-bills
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseBillDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(ApiResponse<string>.Failure("At least one item is required."));

        int newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { PurchaseBillId = newId }, "Purchase bill created and stock updated."));
    }

    // POST /api/purchase-bills/{id}/regenerate
    [HttpPost("{id:int}/regenerate")]
    public async Task<IActionResult> Regenerate(int id, [FromBody] RegeneratePurchaseBillDto dto)
    {
        int newId = await _service.RegenerateAsync(id, dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { PurchaseBillId = newId }, "Purchase bill regenerated and stock updated."));
    }
}
