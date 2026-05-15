using SrinilStay.Api.Features.Authentication.RefreshTokens;

namespace SrinilStay.Api.Features.Authentication;

public static class Logout
{
    public static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/logout", Handler);
    }

    private static async Task<IResult> Handler(
        RefreshTokenService refreshTokenService,
        RefreshTokenCookieTransport refreshTokenCookieTransport,
        HttpContext httpContext
    )
    {
        string? token = refreshTokenCookieTransport.Read(httpContext);

        await refreshTokenService.RevokeFamilyForTokenAsync(token);
        refreshTokenCookieTransport.Clear(httpContext);

        return Results.NoContent();
    }
}
