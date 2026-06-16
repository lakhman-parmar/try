using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Interfaces.Repositories.Sales;

namespace RapidDev.Infrastructure.Repositories.Implementation.Sales;

public class SalesOrderRepository : ISalesOrderRepository
{
    private readonly string _connectionString;

    public SalesOrderRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<SalesOrderListItemDto>> GetAllAsync(SalesOrderFilterDto filter)
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

        var items = await conn.QueryAsync<SalesOrderListItemDto>(
            "usp_SalesOrder_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<SalesOrderListItemDto>
        {
            Items = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<SalesOrderDetailDto?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@sales_order_id", id);

        using var multi = await conn.QueryMultipleAsync(
            "usp_SalesOrder_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        var header = await multi.ReadFirstOrDefaultAsync<SalesOrderDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<SalesOrderItemDetailDto>();
        return header;
    }

    public async Task<PagedResult<EstimationForSoDto>> GetEstimationsForSoAsync(int customerId, int pageNumber, int pageSize)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@customer_id", customerId);
        parameters.Add("@PageNumber", pageNumber);
        parameters.Add("@PageSize", pageSize);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        using var multi = await conn.QueryMultipleAsync(
            "usp_SalesOrder_GetEstimationsForSO",
            parameters,
            commandType: CommandType.StoredProcedure);

        var headers = (await multi.ReadAsync<EstimationForSoDto>()).ToList();
        var allItems = (await multi.ReadAsync<EstimationItemForSoDto>()).ToList();

        var itemsByEstimation = allItems.GroupBy(i => i.EstimationId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var header in headers)
        {
            if (itemsByEstimation.TryGetValue(header.EstimationId, out var items))
                header.Items = items;
        }

        return new PagedResult<EstimationForSoDto>
        {
            Items = headers,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<int> CreateAsync(CreateSalesOrderDto dto)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@customer_id", dto.CustomerId);
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", BuildItemsTvp(dto.Items).AsTableValuedParameter("dbo.udt_sales_order_item"));

        return await conn.QuerySingleAsync<int>(
            "usp_SalesOrder_Create",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> UpdateAsync(int id, UpdateSalesOrderDto dto)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@sales_order_id", id);
        parameters.Add("@customer_id", dto.CustomerId);
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", BuildItemsTvp(dto.Items).AsTableValuedParameter("dbo.udt_sales_order_item"));

        var rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_SalesOrder_Update",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@sales_order_id", id);

        var rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_SalesOrder_Delete",
            parameters,
            commandType: CommandType.StoredProcedure);

        return rowsAffected > 0;
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreateSalesOrderItemDto> items)
    {
        var table = new DataTable();
        table.Columns.Add("ProductId", typeof(int));
        table.Columns.Add("EstimationId", typeof(int));
        table.Columns.Add("EstimationItemId", typeof(int));
        table.Columns.Add("Quantity", typeof(decimal));
        table.Columns.Add("UnitPrice", typeof(decimal));

        foreach (var item in items)
        {
            var row = table.NewRow();
            row["ProductId"] = item.ProductId;
            row["EstimationId"] = item.EstimationId.HasValue ? (object)item.EstimationId.Value : DBNull.Value;
            row["EstimationItemId"] = item.EstimationItemId.HasValue ? (object)item.EstimationItemId.Value : DBNull.Value;
            row["Quantity"] = item.Quantity;
            row["UnitPrice"] = DBNull.Value;
            table.Rows.Add(row);
        }

        return table;
    }
}
