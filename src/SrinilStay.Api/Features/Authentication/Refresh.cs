using Microsoft.AspNetCore.Identity;
using SrinilStay.Api.Features.Authentication.RefreshTokens;
using SrinilStay.Api.Features.Authentication.Tokens;

namespace SrinilStay.Api.Features.Authentication;

public static class Refresh
{
    public sealed record Response(string AccessToken, string TokenType, int ExpiresIn)
    {
        public static Response Create(AccessToken accessToken) =>
            new(accessToken.Value, "Bearer", accessToken.ExpiresInSeconds);
    }

    public static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/refresh", Handler);
    }

    private static async Task<IResult> Handler(
        TokenService tokenService,
        RefreshTokenService refreshTokenService,
        UserManager<IdentityUser> userManager,
        RefreshTokenCookieTransport refreshTokenCookieTransport,
        HttpContext httpContext
    )
    {
        string? token = refreshTokenCookieTransport.Read(httpContext);
        if (string.IsNullOrWhiteSpace(token))
        {
            refreshTokenCookieTransport.Clear(httpContext);
            return UnauthorizedRefreshProblem();
        }

        RefreshTokenRotationResult result = await refreshTokenService.RotateAsync(token);
        if (result is RefreshTokenRotationResult.Rejected)
        {
            refreshTokenCookieTransport.Clear(httpContext);
            return UnauthorizedRefreshProblem();
        }

        IdentityUser user = result switch
        {
            RefreshTokenRotationResult.Rotated rotation => rotation.User,
            RefreshTokenRotationResult.GraceAccepted graceAccepted => graceAccepted.User,
            _ => throw new InvalidOperationException("Unexpected refresh token rotation result."),
        };

        IList<string> roles = await userManager.GetRolesAsync(user);
        AccessToken accessToken = tokenService.CreateAccessToken(user, roles.ToArray());

        if (result is RefreshTokenRotationResult.Rotated rotated)
        {
            refreshTokenCookieTransport.Set(httpContext, rotated.RefreshToken);
        }

        return Results.Ok(Response.Create(accessToken));
    }

    private static IResult UnauthorizedRefreshProblem() =>
        Results.Problem(
            title: "Unauthorized",
            detail: "A valid refresh token is required.",
            statusCode: StatusCodes.Status401Unauthorized
        );
}
