using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace SrinilStay.Api.Authentication;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        RouteGroupBuilder group = endpoints.MapGroup("/auth").WithTags("Authentication");

        group.MapPost("/register", RegisterAsync);
        group.MapPost("/login", LoginAsync);
        group.MapPost("/refresh", RefreshAsync);
        group.MapPost("/logout", LogoutAsync);
        group.MapGet("/me", GetCurrentUserAsync).RequireAuthorization();

        return group;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        UserManager<IdentityUser> userManager,
        TokenService tokenService,
        RefreshTokenService refreshTokenService,
        RefreshTokenCookieTransport refreshTokenCookieTransport,
        HttpContext httpContext
    )
    {
        if (!TryValidate(request, out Dictionary<string, string[]> validationErrors))
        {
            return Results.ValidationProblem(validationErrors);
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

        return Results.Ok(TokenResponse.Create(accessToken));
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        UserManager<IdentityUser> userManager,
        TokenService tokenService,
        RefreshTokenService refreshTokenService,
        RefreshTokenCookieTransport refreshTokenCookieTransport,
        HttpContext httpContext
    )
    {
        if (!TryValidate(request, out Dictionary<string, string[]> validationErrors))
        {
            return Results.ValidationProblem(validationErrors);
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

        return Results.Ok(TokenResponse.Create(accessToken));
    }

    private static async Task<IResult> RefreshAsync(
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

        return Results.Ok(TokenResponse.Create(accessToken));
    }

    private static async Task<IResult> LogoutAsync(
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

    private static async Task<IResult> GetCurrentUserAsync(
        ClaimsPrincipal principal,
        UserManager<IdentityUser> userManager
    )
    {
        string? userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        IdentityUser? user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        IList<string> roles = await userManager.GetRolesAsync(user);

        return Results.Ok(new CurrentUserResponse(user.Id, user.Email, roles.ToArray()));
    }

    private static IResult InvalidLoginProblem() =>
        Results.Problem(
            title: "Unauthorized",
            detail: "Invalid email or password.",
            statusCode: StatusCodes.Status401Unauthorized
        );

    private static IResult UnauthorizedRefreshProblem() =>
        Results.Problem(
            title: "Unauthorized",
            detail: "A valid refresh token is required.",
            statusCode: StatusCodes.Status401Unauthorized
        );

    private static bool TryValidate<TRequest>(
        TRequest request,
        out Dictionary<string, string[]> validationErrors
    )
        where TRequest : notnull
    {
        List<ValidationResult> results = [];
        ValidationContext context = new(request);

        bool isValid = Validator.TryValidateObject(
            request,
            context,
            results,
            validateAllProperties: true
        );

        validationErrors = results
            .SelectMany(result =>
            {
                string[] memberNames = result.MemberNames.DefaultIfEmpty(string.Empty).ToArray();
                return memberNames.Select(memberName => new
                {
                    MemberName = memberName,
                    ErrorMessage = result.ErrorMessage ?? "The request is invalid.",
                });
            })
            .GroupBy(error => error.MemberName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).ToArray()
            );

        return isValid;
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

    private sealed record RegisterRequest(
        [property: Required] [property: EmailAddress] string Email,
        [property: Required] string Password
    );

    private sealed record LoginRequest(
        [property: Required] [property: EmailAddress] string Email,
        [property: Required] string Password
    );

    private sealed record TokenResponse(string AccessToken, string TokenType, int ExpiresIn)
    {
        public static TokenResponse Create(AccessToken accessToken) =>
            new(accessToken.Value, "Bearer", accessToken.ExpiresInSeconds);
    }

    private sealed record CurrentUserResponse(
        string Id,
        string? Email,
        IReadOnlyCollection<string> Roles
    );
}
