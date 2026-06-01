using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Services.Interfaces.Purchase;

namespace RapidDev.WebApi.Controllers.Purchase;

[ApiController]
[Route("api/purchase-returns")]
public class PurchaseReturnController(IPurchaseReturnService _service) : ControllerBase
{
    // GET /api/purchase-returns?search=&fromDate=&toDate=&supplierId=&pageNumber=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PurchaseReturnFilterDto filter)
    {
        PagedResult<PurchaseReturnListItemDto> result = await _service.GetAllAsync(filter);
        return Ok(ApiResponse<PagedResult<PurchaseReturnListItemDto>>.Success(result));
    }

    // GET /api/purchase-returns/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        PurchaseReturnDetailDto? returnDoc = await _service.GetByIdAsync(id);
        if (returnDoc is null)
            return NotFound(ApiResponse<string>.Failure("Purchase return not found."));

        return Ok(ApiResponse<PurchaseReturnDetailDto>.Success(returnDoc));
    }

    // GET /api/purchase-returns/bills-for-return
    [HttpGet("bills-for-return")]
    public async Task<IActionResult> GetBillsForReturn()
    {
        IEnumerable<BillForReturnDto> result = await _service.GetBillsForReturnAsync();
        return Ok(ApiResponse<IEnumerable<BillForReturnDto>>.Success(result));
    }

    // POST /api/purchase-returns
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseReturnDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(ApiResponse<string>.Failure("At least one item is required."));

        int newId = await _service.CreateAsync(dto);
        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            ApiResponse<object>.Success(new { PurchaseReturnId = newId }, "Purchase return created and stock updated."));
    }
}
