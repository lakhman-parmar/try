using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;

namespace RapidDev.Application.Interfaces.Repositories.Sales;

public interface IEstimationRepository
{
    Task<PagedResult<EstimationListItemDto>> GetAllAsync(EstimationFilterDto filter);
    Task<EstimationDetailDto?> GetByIdAsync(int id);
    Task<int> CreateAsync(CreateEstimationDto dto);
    Task<bool> UpdateAsync(int id, UpdateEstimationDto dto);
    Task<bool> DeleteAsync(int id);
}
