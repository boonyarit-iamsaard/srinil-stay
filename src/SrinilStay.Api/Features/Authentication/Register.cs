using FluentValidation;
using Microsoft.AspNetCore.Identity;
using SrinilStay.Api.Features.Authentication.RefreshTokens;
using SrinilStay.Api.Features.Authentication.Tokens;

namespace SrinilStay.Api.Features.Authentication;

public static class Register
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
        endpoints.MapPost("/register", Handler);
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

        IdentityUser user = new() { Email = request.Email, UserName = request.Email };
        IdentityResult result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return Results.ValidationProblem(ToValidationErrors(result.Errors));
        }

        AccessToken accessToken = tokenService.CreateAccessToken(user, []);
        IssuedRefreshToken refreshToken = await refreshTokenService.IssueAsync(user);
        refreshTokenCookieTransport.Set(httpContext, refreshToken);

        return Results.Ok(Response.Create(accessToken));
    }

    private static Dictionary<string, string[]> ToValidationErrors(
        IEnumerable<IdentityError> errors
    ) =>
        errors
            .GroupBy(error => error.Code)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.Description).ToArray()
            );
}
