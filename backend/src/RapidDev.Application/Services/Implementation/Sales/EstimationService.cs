using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Interfaces.Repositories.Sales;
using RapidDev.Application.Services.Interfaces.Sales;

namespace RapidDev.Application.Services.Implementation.Sales;

public class EstimationService : IEstimationService
{
    private readonly IEstimationRepository _repository;

    public EstimationService(IEstimationRepository repository)
    {
        _repository = repository;
    }

    public Task<PagedResult<EstimationListItemDto>> GetAllAsync(EstimationFilterDto filter)
    {
        return _repository.GetAllAsync(filter);
    }

    public Task<EstimationDetailDto?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public Task<int> CreateAsync(CreateEstimationDto dto)
    {
        return _repository.CreateAsync(dto);
    }

    public Task<bool> UpdateAsync(int id, UpdateEstimationDto dto)
    {
        return _repository.UpdateAsync(id, dto);
    }

    public Task<bool> DeleteAsync(int id)
    {
        return _repository.DeleteAsync(id);
    }
}
