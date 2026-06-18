using Microsoft.Data.SqlClient;
using RapidDev.Application.DTOs.Common;

namespace RapidDev.WebApi.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (SqlException sqlEx) when (sqlEx.Number >= 50000 && sqlEx.Number <= 59999)
        {
            // User-defined THROW errors from stored procedures (50000–59999)
            // These are intentional business-rule violations, not server bugs.
            // Return them as 400 Bad Request with the exact SP message.
            _logger.LogWarning(sqlEx, "Business rule violation from stored procedure (SQL {Number})", sqlEx.Number);

            context.Response.StatusCode  = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<string>.Failure(sqlEx.Message);
            await context.Response.WriteAsJsonAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");

            var message = context.Request.Headers["X-Debug"].Any()
                ? ex.Message
                : "Something went wrong on our end. Please try again later.";

            context.Response.StatusCode  = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<string>.Failure(message);
            await context.Response.WriteAsJsonAsync(response);
        }
    }
}
