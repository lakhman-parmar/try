namespace RapidDev.Application.DTOs.Common;

public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public required string Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Success(T data, string? message = null)
        => new() { IsSuccess = true, Data = data, Message = message ?? string.Empty };

    public static ApiResponse<T> Success(string? message = null)
        => new() { IsSuccess = true, Message = message ?? string.Empty };

    public static ApiResponse<T> Failure(string message, List<string>? errors = null)
        => new() { IsSuccess = false, Message = message, Errors = errors };

    public static ApiResponse<T> EmptyResponse(string? message = null)
        => new() { IsSuccess = true, Message = message ?? string.Empty, Data = default };
}
