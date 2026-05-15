using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SrinilStay.Api.Data;

namespace SrinilStay.Api.Features.Authentication.RefreshTokens;

public sealed class RefreshTokenService(
    ApplicationDbContext dbContext,
    UserManager<IdentityUser> userManager,
    IOptions<RefreshTokenOptions> refreshTokenOptions,
    TimeProvider timeProvider
)
{
    private const int RefreshTokenByteCount = 64;

    private readonly RefreshTokenOptions refreshTokenOptions = refreshTokenOptions.Value;

    public async Task<IssuedRefreshToken> IssueAsync(IdentityUser user)
    {
        DateTimeOffset now = timeProvider.GetUtcNow();
        string token = CreateToken();
        RefreshToken refreshToken = RefreshTokenFamily.StartForUser(
            user.Id,
            HashToken(token),
            now,
            refreshTokenOptions
        );

        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync();

        return new IssuedRefreshToken(token, refreshToken.ExpiresAt);
    }

    public async Task<RefreshTokenRotationResult> RotateAsync(string token)
    {
        DateTimeOffset now = timeProvider.GetUtcNow();
        string tokenHash = HashToken(token);
        RefreshToken? refreshToken = await dbContext
            .RefreshTokens.Include(storedToken => storedToken.ReplacedByToken)
            .SingleOrDefaultAsync(storedToken => storedToken.TokenHash == tokenHash);

        if (refreshToken is null)
        {
            return new RefreshTokenRotationResult.Rejected(
                RefreshTokenRotationRejectionReason.UnknownToken
            );
        }

        if (refreshToken.ExpiresAt <= now)
        {
            await RevokeFamilyAsync(refreshToken.FamilyId, now);
            return new RefreshTokenRotationResult.Rejected(
                RefreshTokenRotationRejectionReason.ExpiredToken
            );
        }

        if (refreshToken.RevokedAt is not null)
        {
            return await TryUseGraceTokenAsync(refreshToken, now);
        }

        IdentityUser? user = await userManager.FindByIdAsync(refreshToken.UserId);
        if (user is null)
        {
            await RevokeFamilyAsync(refreshToken.FamilyId, now);
            return new RefreshTokenRotationResult.Rejected(
                RefreshTokenRotationRejectionReason.MissingUser
            );
        }

        string nextToken = CreateToken();
        RefreshToken nextRefreshToken = RefreshTokenFamily.RotateCurrent(
            refreshToken,
            HashToken(nextToken),
            now,
            refreshTokenOptions
        );

        dbContext.RefreshTokens.Add(nextRefreshToken);
        await dbContext.SaveChangesAsync();

        return new RefreshTokenRotationResult.Rotated(
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

        await RevokeFamilyAsync(refreshToken.FamilyId, timeProvider.GetUtcNow());
    }

    private async Task<RefreshTokenRotationResult> TryUseGraceTokenAsync(
        RefreshToken refreshToken,
        DateTimeOffset now
    )
    {
        if (
            !RefreshTokenFamily.CanUseImmediatelyPreviousToken(
                refreshToken,
                now,
                refreshTokenOptions
            )
        )
        {
            await RevokeFamilyAsync(refreshToken.FamilyId, now);
            return new RefreshTokenRotationResult.Rejected(
                RefreshTokenRotationRejectionReason.ReusedTokenOutsideGrace
            );
        }

        IdentityUser? user = await userManager.FindByIdAsync(refreshToken.UserId);
        if (user is null)
        {
            await RevokeFamilyAsync(refreshToken.FamilyId, now);
            return new RefreshTokenRotationResult.Rejected(
                RefreshTokenRotationRejectionReason.MissingUser
            );
        }

        return new RefreshTokenRotationResult.GraceAccepted(
            user,
            refreshToken.ReplacedByToken!.ExpiresAt
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

public sealed record IssuedRefreshToken(string Value, DateTimeOffset ExpiresAt);
