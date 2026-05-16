using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using SrinilStay.Api.Features.Authentication.Tokens;

namespace SrinilStay.Api.Tests.Features.Authentication.Tokens;

public sealed class TokenServiceTests
{
    [Fact]
    public void CreateAccessTokenUsesTimeProvider()
    {
        DateTimeOffset now = new(2026, 5, 16, 12, 30, 0, TimeSpan.Zero);
        MutableTimeProvider timeProvider = new(now);
        JwtOptions options = new()
        {
            Issuer = "SrinilStay.Api.Tests",
            Audience = "SrinilStay.Api.Tests",
            SigningKey = "srinil-stay-tests-signing-key-32-chars",
            AccessTokenMinutes = 15,
        };
        TokenService tokenService = new(Options.Create(options), timeProvider);

        AccessToken accessToken = tokenService.CreateAccessToken(
            new IdentityUser { Id = "user-id", Email = "user@example.com" },
            []
        );

        JwtSecurityToken jwt = new JwtSecurityTokenHandler().ReadJwtToken(accessToken.Value);
        Assert.Equal(now.AddMinutes(15), accessToken.ExpiresAt);
        Assert.Equal(now.UtcDateTime, jwt.ValidFrom);
        Assert.Equal(now.AddMinutes(15).UtcDateTime, jwt.ValidTo);
    }

    private sealed class MutableTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
