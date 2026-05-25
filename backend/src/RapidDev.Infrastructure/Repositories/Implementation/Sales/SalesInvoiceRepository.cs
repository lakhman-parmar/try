using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.DTOs.Sales;
using RapidDev.Application.Interfaces.Repositories.Sales;

namespace RapidDev.Infrastructure.Repositories.Implementation.Sales;

public class SalesInvoiceRepository : ISalesInvoiceRepository
{
    private readonly string _connectionString;

    public SalesInvoiceRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<SalesInvoiceListItemDto>> GetAllAsync(SalesInvoiceFilterDto filter)
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

        var items = await conn.QueryAsync<SalesInvoiceListItemDto>(
            "usp_SalesInvoice_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<SalesInvoiceListItemDto>
        {
            Items = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<SalesInvoiceDetailDto?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@sales_invoice_id", id);

        using var multi = await conn.QueryMultipleAsync(
            "usp_SalesInvoice_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        var header = await multi.ReadFirstOrDefaultAsync<SalesInvoiceDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<SalesInvoiceItemDetailDto>();
        return header;
    }

    public async Task<IEnumerable<SalesOrderForInvoiceDto>> GetOrdersForInvoiceAsync()
    {
        using var conn = CreateConnection();

        using var multi = await conn.QueryMultipleAsync(
            "usp_SalesInvoice_GetOrdersForInvoice",
            commandType: CommandType.StoredProcedure);

        var headers = (await multi.ReadAsync<SalesOrderForInvoiceDto>()).ToList();
        var allItems = (await multi.ReadAsync<SalesOrderItemForInvoiceDto>()).ToList();

        var itemsByOrder = allItems.GroupBy(i => i.SalesOrderId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var header in headers)
        {
            if (itemsByOrder.TryGetValue(header.SalesOrderId, out var items))
                header.Items = items;
        }

        return headers;
    }

    public async Task<int> CreateAsync(CreateSalesInvoiceDto dto)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@customer_id", dto.CustomerId);
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks", dto.Remarks);
        parameters.Add("@items", BuildItemsTvp(dto.Items).AsTableValuedParameter("dbo.udt_sales_invoice_item"));

        return await conn.QuerySingleAsync<int>(
            "usp_SalesInvoice_Create",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> RegenerateAsync(int sourceInvoiceId, RegenerateSalesInvoiceDto dto)
    {
        using var conn = CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@source_invoice_id", sourceInvoiceId);
        parameters.Add("@tax_percentage", dto.TaxPercentage);
        parameters.Add("@remarks", dto.Remarks);

        return await conn.QuerySingleAsync<int>(
            "usp_SalesInvoice_Regenerate",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreateSalesInvoiceItemDto> items)
    {
        var table = new DataTable();
        table.Columns.Add("ProductId", typeof(int));
        table.Columns.Add("SalesOrderId", typeof(int));
        table.Columns.Add("SalesOrderItemId", typeof(int));
        table.Columns.Add("Quantity", typeof(decimal));
        table.Columns.Add("UnitPrice", typeof(decimal));

        foreach (var item in items)
        {
            var row = table.NewRow();
            row["ProductId"] = item.ProductId;
            row["SalesOrderId"] = item.SalesOrderId.HasValue ? (object)item.SalesOrderId.Value : DBNull.Value;
            row["SalesOrderItemId"] = item.SalesOrderItemId.HasValue ? (object)item.SalesOrderItemId.Value : DBNull.Value;
            row["Quantity"] = item.Quantity;
            row["UnitPrice"] = item.UnitPrice.HasValue ? (object)item.UnitPrice.Value : DBNull.Value;
            table.Rows.Add(row);
        }

        return table;
    }
}
