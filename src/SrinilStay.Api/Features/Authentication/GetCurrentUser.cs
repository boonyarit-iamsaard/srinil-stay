using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace SrinilStay.Api.Features.Authentication;

public static class GetCurrentUser
{
    public sealed record Response(string Id, string? Email, IReadOnlyCollection<string> Roles);

    public static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/me", Handler).RequireAuthorization();
    }

    private static async Task<IResult> Handler(
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

        return Results.Ok(new Response(user.Id, user.Email, roles.ToArray()));
    }
}
