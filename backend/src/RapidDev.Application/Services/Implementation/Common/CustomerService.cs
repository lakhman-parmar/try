using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Interfaces.Repositories.Common;
using RapidDev.Application.Services.Interfaces.Common;

namespace RapidDev.Application.Services.Implementation.Common;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _repository;

    public CustomerService(ICustomerRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<CustomerDto>> GetAllAsync()
    {
        return _repository.GetAllAsync();
    }
}
