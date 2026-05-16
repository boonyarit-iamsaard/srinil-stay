using Microsoft.AspNetCore.Identity;
using SrinilStay.Api.Features.Authentication.RefreshTokens;
using SrinilStay.Api.Features.Authentication.Tokens;

namespace SrinilStay.Api.Features.Authentication;

public sealed class AuthenticationTokenIssuer(
    UserManager<IdentityUser> userManager,
    TokenService tokenService,
    RefreshTokenService refreshTokenService
)
{
    public async Task<AuthenticationTokens> IssueRememberedAuthenticationAsync(IdentityUser user)
    {
        AccessToken accessToken = await IssueAccessTokenAsync(user);
        IssuedRefreshToken refreshToken = await refreshTokenService.IssueAsync(user);

        return new AuthenticationTokens(accessToken, refreshToken);
    }

    public async Task<AccessToken> IssueAccessTokenAsync(IdentityUser user)
    {
        IList<string> roles = await userManager.GetRolesAsync(user);

        return tokenService.CreateAccessToken(user, roles.ToArray());
    }
}

public sealed record AuthenticationTokens(AccessToken AccessToken, IssuedRefreshToken RefreshToken);
