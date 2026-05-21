using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RapidDev.Application.DTOs.Auth;
using RapidDev.Application.DTOs.Auth.Request;
using RapidDev.Application.DTOs.Auth.Response;
using RapidDev.Application.DTOs.Common;
using RapidDev.Application.Services.Interfaces.Auth;

namespace RapidDev.WebApi.Controllers.Auth;

[Route("api/[controller]")]
[ApiController]
public class AdminAuthController : ControllerBase
{
    private readonly IAdminAuthService _adminAuthService;

    public AdminAuthController(IAdminAuthService adminAuthService)
    {
        _adminAuthService = adminAuthService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(AdminLoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<string>.Failure(
                "Validation failed",
                ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));

        var result = await _adminAuthService.LoginAsync(dto);

        if (result.IsSuccess)
        {
            Response.Cookies.Append("AuthRefreshToken", result.Data!.RefreshToken!, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(30)
            });

            var tokenResponse = TokenResponse.SetToken(result.Data.Token!);

            return Ok(ApiResponse<TokenResponse>.Success(tokenResponse, "Logged In Successfully"));
        }

        return Unauthorized(result);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var rawToken = Request.Cookies["AuthRefreshToken"];

        if (string.IsNullOrWhiteSpace(rawToken))
            return Unauthorized(ApiResponse<string>.Failure("No refresh token found"));

        var result = await _adminAuthService.RefreshAsync(rawToken);

        if (result.IsSuccess)
        {
            Response.Cookies.Append("AuthRefreshToken", result.Data!.RefreshToken!, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(30)
            });

            var tokenResponse = TokenResponse.SetToken(result.Data.Token!);

            return Ok(ApiResponse<TokenResponse>.Success(tokenResponse, "Token Refreshed Successfully"));
        }

        Response.Cookies.Delete("AuthRefreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        return Unauthorized(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var rawToken = Request.Cookies["AuthRefreshToken"];

        var result = await _adminAuthService.LogoutAsync(rawToken ?? string.Empty);

        Response.Cookies.Delete("AuthRefreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        return Ok(result);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var adminIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized(ApiResponse<string>.Failure("Unauthorized access. Invalid token."));
        }

        var result = await _adminAuthService.GetProfileAsync(adminId);
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }
}
