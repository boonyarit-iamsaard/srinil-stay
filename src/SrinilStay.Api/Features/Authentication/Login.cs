using FluentValidation;
using Microsoft.AspNetCore.Identity;
using SrinilStay.Api.Features.Authentication.RefreshTokens;
using SrinilStay.Api.Features.Authentication.Tokens;

namespace SrinilStay.Api.Features.Authentication;

public static class Login
{
    public sealed record Request(string Email, string Password);

    public sealed record Response(string AccessToken, string TokenType, int ExpiresIn)
    {
        public static Response Create(AccessToken accessToken) =>
            new(accessToken.Value, "Bearer", accessToken.ExpiresInSeconds);
    }

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(request => request.Email).NotEmpty().EmailAddress();
            RuleFor(request => request.Password).NotEmpty();
        }
    }

    public static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/login", Handler);
    }

    private static async Task<IResult> Handler(
        Request request,
        IValidator<Request> validator,
        UserManager<IdentityUser> userManager,
        TokenService tokenService,
        RefreshTokenService refreshTokenService,
        RefreshTokenCookieTransport refreshTokenCookieTransport,
        HttpContext httpContext
    )
    {
        FluentValidation.Results.ValidationResult validationResult = await validator.ValidateAsync(
            request,
            httpContext.RequestAborted
        );

        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(validationResult.ToDictionary());
        }

        IdentityUser? user = await userManager.FindByEmailAsync(request.Email);

        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return InvalidLoginProblem();
        }

        IList<string> roles = await userManager.GetRolesAsync(user);
        AccessToken accessToken = tokenService.CreateAccessToken(user, roles.ToArray());
        IssuedRefreshToken refreshToken = await refreshTokenService.IssueAsync(user);
        refreshTokenCookieTransport.Set(httpContext, refreshToken);

        return Results.Ok(Response.Create(accessToken));
    }

    private static IResult InvalidLoginProblem() =>
        Results.Problem(
            title: "Unauthorized",
            detail: "Invalid email or password.",
            statusCode: StatusCodes.Status401Unauthorized
        );
}
