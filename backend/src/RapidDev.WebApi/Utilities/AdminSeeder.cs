using System.Data;
using Microsoft.Data.SqlClient;
using RapidDev.Application.Service.Interface.Common;

namespace RapidDev.WebApi.Utilities;

public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["ConnectionStrings:DefaultConnection"];

        if (string.IsNullOrWhiteSpace(connectionString))
            return;

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        const string email = "admin@gmail.com";
        const string password = "Admin@123";

        await using var existsCommand = new SqlCommand(
            "SELECT password_hash FROM dbo.Admin WHERE email = @Email",
            connection);

        existsCommand.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 256) { Value = email });

        var existingHash = await existsCommand.ExecuteScalarAsync() as string;
        if (!string.IsNullOrWhiteSpace(existingHash))
            return;

        var passwordHash = await passwordHasher.Hash(password);

        if (existingHash != null)
        {
            await using var updateCommand = new SqlCommand(
                "UPDATE dbo.Admin SET password_hash = @PasswordHash WHERE email = @Email",
                connection);

            updateCommand.Parameters.Add(new SqlParameter("@PasswordHash", SqlDbType.NVarChar, -1) { Value = passwordHash });
            updateCommand.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 256) { Value = email });

            await updateCommand.ExecuteNonQueryAsync();
            return;
        }

        await using var insertCommand = new SqlCommand(
            "INSERT INTO dbo.Admin (name, email, password_hash, created_at) VALUES (@Name, @Email, @PasswordHash, @CreatedAt)",
            connection);

        insertCommand.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 256) { Value = "Admin" });
        insertCommand.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 256) { Value = email });
        insertCommand.Parameters.Add(new SqlParameter("@PasswordHash", SqlDbType.NVarChar, -1) { Value = passwordHash });
        insertCommand.Parameters.Add(new SqlParameter("@CreatedAt", SqlDbType.DateTime2) { Value = DateTime.UtcNow });

        await insertCommand.ExecuteNonQueryAsync();
    }
}
