using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

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
        IOptions<RefreshTokenOptions> refreshTokenOptions,
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
        SetRefreshTokenCookie(httpContext, refreshToken, refreshTokenOptions.Value);

        return Results.Ok(TokenResponse.Create(accessToken));
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        UserManager<IdentityUser> userManager,
        TokenService tokenService,
        RefreshTokenService refreshTokenService,
        IOptions<RefreshTokenOptions> refreshTokenOptions,
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
        SetRefreshTokenCookie(httpContext, refreshToken, refreshTokenOptions.Value);

        return Results.Ok(TokenResponse.Create(accessToken));
    }

    private static async Task<IResult> RefreshAsync(
        TokenService tokenService,
        RefreshTokenService refreshTokenService,
        UserManager<IdentityUser> userManager,
        IOptions<RefreshTokenOptions> refreshTokenOptions,
        HttpContext httpContext
    )
    {
        RefreshTokenOptions options = refreshTokenOptions.Value;
        string? token = httpContext.Request.Cookies[options.CookieName];
        if (string.IsNullOrWhiteSpace(token))
        {
            ClearRefreshTokenCookie(httpContext, options);
            return UnauthorizedRefreshProblem();
        }

        RefreshTokenRotationResult? result = await refreshTokenService.RotateAsync(token);
        if (result is null)
        {
            ClearRefreshTokenCookie(httpContext, options);
            return UnauthorizedRefreshProblem();
        }

        IList<string> roles = await userManager.GetRolesAsync(result.User);
        AccessToken accessToken = tokenService.CreateAccessToken(result.User, roles.ToArray());
        SetRefreshTokenCookie(httpContext, result.RefreshToken, options);

        return Results.Ok(TokenResponse.Create(accessToken));
    }

    private static async Task<IResult> LogoutAsync(
        RefreshTokenService refreshTokenService,
        IOptions<RefreshTokenOptions> refreshTokenOptions,
        HttpContext httpContext
    )
    {
        RefreshTokenOptions options = refreshTokenOptions.Value;
        string? token = httpContext.Request.Cookies[options.CookieName];

        await refreshTokenService.RevokeFamilyForTokenAsync(token);
        ClearRefreshTokenCookie(httpContext, options);

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

    private static void SetRefreshTokenCookie(
        HttpContext httpContext,
        IssuedRefreshToken refreshToken,
        RefreshTokenOptions refreshTokenOptions
    )
    {
        if (refreshToken.Value is null)
        {
            return;
        }

        httpContext.Response.Cookies.Append(
            refreshTokenOptions.CookieName,
            refreshToken.Value,
            CreateRefreshTokenCookieOptions(refreshToken.ExpiresAt)
        );
    }

    private static void ClearRefreshTokenCookie(
        HttpContext httpContext,
        RefreshTokenOptions refreshTokenOptions
    ) =>
        httpContext.Response.Cookies.Delete(
            refreshTokenOptions.CookieName,
            CreateRefreshTokenCookieOptions(DateTimeOffset.UnixEpoch)
        );

    private static CookieOptions CreateRefreshTokenCookieOptions(DateTimeOffset expiresAt) =>
        new()
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/auth",
            Expires = expiresAt,
        };

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
