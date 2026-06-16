using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Interfaces.Repositories.Sales;

namespace RapidDev.Infrastructure.Repositories.Implementation.Sales;

public class EstimationRepository : IEstimationRepository
{
    private readonly string _connectionString;

    public EstimationRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<EstimationListItemDto>> GetAllAsync(EstimationFilterDto filter)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@Search", filter.Search);
        parameters.Add("@FromDate", filter.FromDate);
        parameters.Add("@ToDate", filter.ToDate);
        parameters.Add("@CustomerId", filter.CustomerId);
        parameters.Add("@PageNumber", filter.PageNumber);
        parameters.Add("@PageSize", filter.PageSize);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        var items = await conn.QueryAsync<EstimationListItemDto>(
            "usp_Estimation_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<EstimationListItemDto>
        {
            Items = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<EstimationDetailDto?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@estimation_id", id);

        using var multi = await conn.QueryMultipleAsync(
            "usp_Estimation_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        var header = await multi.ReadFirstOrDefaultAsync<EstimationDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<EstimationItemDetailDto>();
        return header;
    }

    public async Task<int> CreateAsync(CreateEstimationDto dto)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@customer_id", dto.CustomerId);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", BuildItemsTvp(dto.Items).AsTableValuedParameter("dbo.udt_estimation_item"));

        return await conn.QuerySingleAsync<int>(
            "usp_Estimation_Create",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> UpdateAsync(int id, UpdateEstimationDto dto)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@estimation_id", id);
        parameters.Add("@customer_id", dto.CustomerId);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", BuildItemsTvp(dto.Items).AsTableValuedParameter("dbo.udt_estimation_item"));

        var rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_Estimation_Update",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@estimation_id", id);

        var rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_Estimation_Delete",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreateEstimationItemDto> items)
    {
        var table = new DataTable();
        table.Columns.Add("product_id", typeof(int));
        table.Columns.Add("quantity", typeof(decimal));
        table.Columns.Add("unit_price", typeof(decimal));

        foreach (var item in items)
            table.Rows.Add(item.ProductId, item.Quantity, item.UnitPrice ?? (object)DBNull.Value);

        return table;
    }
}
