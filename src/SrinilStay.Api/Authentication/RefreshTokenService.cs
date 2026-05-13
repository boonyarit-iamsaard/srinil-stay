using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SrinilStay.Api.Data;

namespace SrinilStay.Api.Authentication;

public sealed class RefreshTokenService(
    ApplicationDbContext dbContext,
    UserManager<IdentityUser> userManager,
    IOptions<RefreshTokenOptions> refreshTokenOptions
)
{
    private const int RefreshTokenByteCount = 64;

    private readonly RefreshTokenOptions refreshTokenOptions = refreshTokenOptions.Value;

    public async Task<IssuedRefreshToken> IssueAsync(IdentityUser user)
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        string token = CreateToken();

        RefreshToken refreshToken = new()
        {
            Id = Guid.NewGuid(),
            FamilyId = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = HashToken(token),
            CreatedAt = now,
            ExpiresAt = now.AddDays(refreshTokenOptions.IdleLifetimeDays),
        };

        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync();

        return new IssuedRefreshToken(token, refreshToken.ExpiresAt);
    }

    public async Task<RefreshTokenRotationResult?> RotateAsync(string token)
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        string tokenHash = HashToken(token);
        RefreshToken? refreshToken = await dbContext
            .RefreshTokens.Include(storedToken => storedToken.ReplacedByToken)
            .SingleOrDefaultAsync(storedToken => storedToken.TokenHash == tokenHash);

        if (refreshToken is null)
        {
            return null;
        }

        if (refreshToken.ExpiresAt <= now)
        {
            await RevokeFamilyAsync(refreshToken.FamilyId, now);
            return null;
        }

        if (refreshToken.RevokedAt is not null)
        {
            return await TryUseGraceTokenAsync(refreshToken, now);
        }

        IdentityUser? user = await userManager.FindByIdAsync(refreshToken.UserId);
        if (user is null)
        {
            await RevokeFamilyAsync(refreshToken.FamilyId, now);
            return null;
        }

        string nextToken = CreateToken();
        RefreshToken nextRefreshToken = new()
        {
            Id = Guid.NewGuid(),
            FamilyId = refreshToken.FamilyId,
            UserId = refreshToken.UserId,
            TokenHash = HashToken(nextToken),
            CreatedAt = now,
            ExpiresAt = now.AddDays(refreshTokenOptions.IdleLifetimeDays),
        };

        refreshToken.LastUsedAt = now;
        refreshToken.RevokedAt = now;
        refreshToken.ReplacedByTokenId = nextRefreshToken.Id;

        dbContext.RefreshTokens.Add(nextRefreshToken);
        await dbContext.SaveChangesAsync();

        return new RefreshTokenRotationResult(
            user,
            new IssuedRefreshToken(nextToken, nextRefreshToken.ExpiresAt)
        );
    }

    public async Task RevokeFamilyForTokenAsync(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return;
        }

        string tokenHash = HashToken(token);
        RefreshToken? refreshToken = await dbContext.RefreshTokens.SingleOrDefaultAsync(
            storedToken => storedToken.TokenHash == tokenHash
        );

        if (refreshToken is null)
        {
            return;
        }

        await RevokeFamilyAsync(refreshToken.FamilyId, DateTimeOffset.UtcNow);
    }

    private async Task<RefreshTokenRotationResult?> TryUseGraceTokenAsync(
        RefreshToken refreshToken,
        DateTimeOffset now
    )
    {
        if (
            refreshToken.ReplacedByToken is null
            || refreshToken.RevokedAt is null
            || now - refreshToken.RevokedAt.Value
                > TimeSpan.FromSeconds(refreshTokenOptions.RotationGraceSeconds)
        )
        {
            await RevokeFamilyAsync(refreshToken.FamilyId, now);
            return null;
        }

        IdentityUser? user = await userManager.FindByIdAsync(refreshToken.UserId);
        if (user is null || refreshToken.ReplacedByToken.ExpiresAt <= now)
        {
            await RevokeFamilyAsync(refreshToken.FamilyId, now);
            return null;
        }

        return new RefreshTokenRotationResult(
            user,
            new IssuedRefreshToken(null, refreshToken.ReplacedByToken.ExpiresAt)
        );
    }

    private async Task RevokeFamilyAsync(Guid familyId, DateTimeOffset revokedAt)
    {
        List<RefreshToken> familyTokens = await dbContext
            .RefreshTokens.Where(refreshToken =>
                refreshToken.FamilyId == familyId && refreshToken.RevokedAt == null
            )
            .ToListAsync();

        foreach (RefreshToken familyToken in familyTokens)
        {
            familyToken.RevokedAt = revokedAt;
        }

        await dbContext.SaveChangesAsync();
    }

    private static string CreateToken() =>
        WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(RefreshTokenByteCount));

    private static string HashToken(string token)
    {
        byte[] tokenBytes = System.Text.Encoding.UTF8.GetBytes(token);
        byte[] hash = SHA256.HashData(tokenBytes);

        return WebEncoders.Base64UrlEncode(hash);
    }
}

public sealed record IssuedRefreshToken(string? Value, DateTimeOffset ExpiresAt);

public sealed record RefreshTokenRotationResult(IdentityUser User, IssuedRefreshToken RefreshToken);
