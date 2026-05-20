namespace RapidDev.Application.DTOs.Common;

public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public required string Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Success(T data, string message = "Request successful.")
        => new() { IsSuccess = true, Data = data, Message = message };

    public static ApiResponse<T> Success(string message = "Request successful.")
        => new() { IsSuccess = true, Message = message };

    public static ApiResponse<T> Failure(string message, List<string>? errors = null)
        => new() { IsSuccess = false, Message = message, Errors = errors };

    public static ApiResponse<T> EmptyResponse(string message = "No data available.")
        => new() { IsSuccess = true, Message = message, Data = default };
}
