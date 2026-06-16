using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Interfaces.Repositories.Sales;

namespace RapidDev.Infrastructure.Repositories.Implementation.Sales;

public class SalesReturnRepository : ISalesReturnRepository
{
    private readonly string _connectionString;

    public SalesReturnRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<SalesReturnListItemDto>> GetAllAsync(SalesReturnFilterDto filter)
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

        var items = await conn.QueryAsync<SalesReturnListItemDto>(
            "usp_SalesReturn_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<SalesReturnListItemDto>
        {
            Items = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<SalesReturnDetailDto?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@sales_return_id", id);

        using var multi = await conn.QueryMultipleAsync(
            "usp_SalesReturn_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        var header = await multi.ReadFirstOrDefaultAsync<SalesReturnDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<SalesReturnItemDetailDto>();
        return header;
    }

    public async Task<PagedResult<SalesInvoiceForReturnDto>> GetInvoicesForReturnAsync(int? customerId, int pageNumber, int pageSize)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@CustomerId", customerId);
        parameters.Add("@PageNumber", pageNumber);
        parameters.Add("@PageSize", pageSize);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        using var multi = await conn.QueryMultipleAsync(
            "usp_SalesReturn_GetInvoicesForReturn",
            parameters,
            commandType: CommandType.StoredProcedure);

        var headers = (await multi.ReadAsync<SalesInvoiceForReturnDto>()).ToList();
        var allItems = (await multi.ReadAsync<SalesInvoiceItemForReturnDto>()).ToList();

        var itemsByInvoice = allItems.GroupBy(i => i.SalesInvoiceId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var header in headers)
        {
            if (itemsByInvoice.TryGetValue(header.SalesInvoiceId, out var items))
                header.Items = items;
        }

        return new PagedResult<SalesInvoiceForReturnDto>
        {
            Items = headers,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<int> CreateAsync(CreateSalesReturnDto dto)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@sales_invoice_id", dto.SalesInvoiceId);
        parameters.Add("@customer_id", dto.CustomerId);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", BuildItemsTvp(dto.Items).AsTableValuedParameter("dbo.udt_sales_return_item"));

        return await conn.QuerySingleAsync<int>(
            "usp_SalesReturn_Create",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreateSalesReturnItemDto> items)
    {
        var table = new DataTable();
        table.Columns.Add("ProductId", typeof(int));
        table.Columns.Add("SalesInvoiceId", typeof(int));
        table.Columns.Add("SalesInvoiceItemId", typeof(int));
        table.Columns.Add("Quantity", typeof(decimal));
        table.Columns.Add("UnitPrice", typeof(decimal));

        foreach (var item in items)
        {
            var row = table.NewRow();
            row["ProductId"] = item.ProductId;
            row["SalesInvoiceId"] = item.SalesInvoiceId;
            row["SalesInvoiceItemId"] = item.SalesInvoiceItemId;
            row["Quantity"] = item.Quantity;
            row["UnitPrice"] = item.UnitPrice.HasValue ? (object)item.UnitPrice.Value : DBNull.Value;
            table.Rows.Add(row);
        }

        return table;
    }
}
