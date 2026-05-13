using Microsoft.Extensions.Options;

namespace SrinilStay.Api.Authentication;

public sealed class RefreshTokenCookieTransport(IOptions<RefreshTokenOptions> refreshTokenOptions)
{
    private readonly RefreshTokenOptions refreshTokenOptions = refreshTokenOptions.Value;

    public string? Read(HttpContext httpContext) =>
        httpContext.Request.Cookies[refreshTokenOptions.CookieName];

    public void Set(HttpContext httpContext, IssuedRefreshToken refreshToken) =>
        httpContext.Response.Cookies.Append(
            refreshTokenOptions.CookieName,
            refreshToken.Value,
            CreateCookieOptions(refreshToken.ExpiresAt)
        );

    public void Clear(HttpContext httpContext) =>
        httpContext.Response.Cookies.Delete(
            refreshTokenOptions.CookieName,
            CreateCookieOptions(DateTimeOffset.UnixEpoch)
        );

    private static CookieOptions CreateCookieOptions(DateTimeOffset expiresAt) =>
        new()
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/auth",
            Expires = expiresAt,
        };
}
