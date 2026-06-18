using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Interfaces.Repositories.Common;

namespace RapidDev.Infrastructure.Repositories.Implementation.Common;

public class ProductRepository(IConfiguration configuration) : IProductRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found.");

    private IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    public async Task<IEnumerable<ProductDto>> GetAllAsync(int? supplierId = null)
    {
        using IDbConnection conn = CreateConnection();

        const string sp = "sp_GetAllProducts";
        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@supplier_id", supplierId);

        IEnumerable<ProductDto> products = await conn.QueryAsync<ProductDto>(
            sp,
            parameters,
            commandType: CommandType.StoredProcedure
        );

        return products;
    }

    public async Task<IEnumerable<SupplierDto>> GetSuppliersAsync()
    {
        using IDbConnection conn = CreateConnection();

        return await conn.QueryAsync<SupplierDto>(
            "sp_GetAllSuppliers",
            commandType: CommandType.StoredProcedure
        );
    }

    public async Task<IEnumerable<SupplierProductDto>> GetSuppliersByProductAsync(int productId)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@product_id", productId);

        return await conn.QueryAsync<SupplierProductDto>(
            "usp_SupplierProduct_GetByProduct",
            parameters,
            commandType: CommandType.StoredProcedure
        );
    }

    public async Task<int> UpsertSupplierProductAsync(UpsertSupplierProductDto dto)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@product_id", dto.ProductId);
        parameters.Add("@supplier_id", dto.SupplierId);
        parameters.Add("@purchase_price", dto.PurchasePrice);

        return await conn.QuerySingleAsync<int>(
            "usp_SupplierProduct_Upsert",
            parameters,
            commandType: CommandType.StoredProcedure
        );
    }

    public async Task<bool> DeleteSupplierProductAsync(int supplierProductId)
    {
        using IDbConnection conn = CreateConnection();

        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("@supplier_product_id", supplierProductId);

        int rowsAffected = await conn.QuerySingleAsync<int>(
            "usp_SupplierProduct_Delete",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        return rowsAffected > 0;
    }
}
