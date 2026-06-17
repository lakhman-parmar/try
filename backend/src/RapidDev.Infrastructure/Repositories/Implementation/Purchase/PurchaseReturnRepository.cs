using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Purchase;
using RapidDev.Application.Interfaces.Repositories.Purchase;

namespace RapidDev.Infrastructure.Repositories.Implementation.Purchase;

public class PurchaseReturnRepository(IConfiguration configuration) : IPurchaseReturnRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<PagedResult<PurchaseReturnListItemDto>> GetAllAsync(PurchaseReturnFilterDto filter)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@Search",      filter.Search);
        parameters.Add("@FromDate",    filter.FromDate);
        parameters.Add("@ToDate",      filter.ToDate);
        parameters.Add("@SupplierId",  filter.SupplierId);
        parameters.Add("@PageNumber",  filter.PageNumber);
        parameters.Add("@PageSize",    filter.PageSize);
        parameters.Add("@TotalCount",  dbType: DbType.Int32, direction: ParameterDirection.Output);

        IEnumerable<PurchaseReturnListItemDto> items = await conn.QueryAsync<PurchaseReturnListItemDto>(
            "usp_PurchaseReturn_GetAll",
            parameters,
            commandType: CommandType.StoredProcedure);

        return new PagedResult<PurchaseReturnListItemDto>
        {
            Items      = items,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = filter.PageNumber,
            PageSize   = filter.PageSize
        };
    }

    public async Task<PurchaseReturnDetailDto?> GetByIdAsync(int id)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@purchase_return_id", id);

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_PurchaseReturn_GetById",
            parameters,
            commandType: CommandType.StoredProcedure);

        PurchaseReturnDetailDto? header = await multi.ReadFirstOrDefaultAsync<PurchaseReturnDetailDto>();
        if (header is null) return null;

        header.Items = await multi.ReadAsync<PurchaseReturnItemDetailDto>();
        return header;
    }

    public async Task<PagedResult<BillForReturnDto>> GetBillsForReturnAsync(int pageNumber, int pageSize)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@PageNumber", pageNumber);
        parameters.Add("@PageSize",   pageSize);
        parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        using SqlMapper.GridReader multi = await conn.QueryMultipleAsync(
            "usp_PurchaseReturn_GetBillsForReturn",
            parameters,
            commandType: CommandType.StoredProcedure);

        List<BillForReturnDto> bills = (await multi.ReadAsync<BillForReturnDto>()).ToList();
        List<BillItemForReturnDto> allItems = (await multi.ReadAsync<BillItemForReturnDto>()).ToList();

        Dictionary<int, IEnumerable<BillItemForReturnDto>> itemsByBill = allItems
            .GroupBy(i => i.PurchaseBillId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (BillForReturnDto bill in bills)
        {
            if (itemsByBill.TryGetValue(bill.PurchaseBillId, out IEnumerable<BillItemForReturnDto>? items))
                bill.Items = items;
        }

        return new PagedResult<BillForReturnDto>
        {
            Items      = bills,
            TotalCount = parameters.Get<int>("@TotalCount"),
            PageNumber = pageNumber,
            PageSize   = pageSize
        };
    }

    public async Task<int> CreateAsync(CreatePurchaseReturnDto dto)
    {
        using IDbConnection conn = CreateConnection();

        DataTable itemsTable = BuildItemsTvp(dto.Items);

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@remarks",        dto.Remarks);
        parameters.Add("@items",          itemsTable.AsTableValuedParameter("dbo.udt_purchase_return_item"));

        return await conn.QuerySingleAsync<int>(
            "usp_PurchaseReturn_Create",
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    private static DataTable BuildItemsTvp(IEnumerable<CreatePurchaseReturnItemDto> items)
    {
        DataTable table = new DataTable();
        table.Columns.Add("ProductId",          typeof(int));
        table.Columns.Add("PurchaseBillId",     typeof(int));
        table.Columns.Add("PurchaseBillItemId", typeof(int));
        table.Columns.Add("Quantity",           typeof(decimal));
        table.Columns.Add("UnitPrice",          typeof(decimal));

        foreach (CreatePurchaseReturnItemDto item in items)
        {
            DataRow row = table.NewRow();
            row["ProductId"]          = item.ProductId;
            row["PurchaseBillId"]     = item.PurchaseBillId;
            row["PurchaseBillItemId"] = item.PurchaseBillItemId;
            row["Quantity"]           = item.Quantity;
            row["UnitPrice"]          = item.UnitPrice.HasValue
                                            ? (object)item.UnitPrice.Value : DBNull.Value;
            table.Rows.Add(row);
        }

        return table;
    }
}
