using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace SrinilStay.Api.Authentication;

public sealed class TokenService(IOptions<JwtOptions> jwtOptions)
{
    private readonly JwtOptions jwtOptions = jwtOptions.Value;

    public string CreateAccessToken(IdentityUser user, IReadOnlyCollection<string> roles)
    {
        SymmetricSecurityKey signingKey = new(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));
        SigningCredentials credentials = new(signingKey, SecurityAlgorithms.HmacSha256);
        DateTimeOffset now = DateTimeOffset.UtcNow;

        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id),
        ];

        foreach (string role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        JwtSecurityToken token = new(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: now.AddMinutes(jwtOptions.AccessTokenMinutes).UtcDateTime,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
