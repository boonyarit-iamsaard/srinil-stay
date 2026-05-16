namespace SrinilStay.Api.Features.Authentication.RefreshTokens;

internal static class RefreshTokenFamily
{
    public static RefreshToken StartForUser(
        string userId,
        string tokenHash,
        DateTimeOffset now,
        RefreshTokenOptions options
    ) =>
        new()
        {
            Id = Guid.NewGuid(),
            FamilyId = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            CreatedAt = now,
            ExpiresAt = now.AddDays(options.IdleLifetimeDays),
        };

    public static RefreshToken RotateCurrent(
        RefreshToken current,
        string nextTokenHash,
        DateTimeOffset now,
        RefreshTokenOptions options
    )
    {
        RefreshToken next = new()
        {
            Id = Guid.NewGuid(),
            FamilyId = current.FamilyId,
            UserId = current.UserId,
            TokenHash = nextTokenHash,
            CreatedAt = now,
            ExpiresAt = now.AddDays(options.IdleLifetimeDays),
        };

        current.LastUsedAt = now;
        current.RevokedAt = now;
        current.ReplacedByTokenId = next.Id;

        return next;
    }

    public static RefreshTokenFamilyRotationDecision DecideRotation(
        RefreshToken refreshToken,
        DateTimeOffset now,
        RefreshTokenOptions options
    )
    {
        if (refreshToken.ExpiresAt <= now)
        {
            return new RefreshTokenFamilyRotationDecision.Reject(
                RefreshTokenRotationRejectionReason.ExpiredToken,
                RevokesFamily: true
            );
        }

        if (refreshToken.RevokedAt is null)
        {
            return new RefreshTokenFamilyRotationDecision.RotateCurrent();
        }

        if (CanUseImmediatelyPreviousToken(refreshToken, now, options))
        {
            return new RefreshTokenFamilyRotationDecision.AcceptGrace(
                refreshToken.ReplacedByToken!.ExpiresAt
            );
        }

        return new RefreshTokenFamilyRotationDecision.Reject(
            RefreshTokenRotationRejectionReason.ReusedTokenOutsideGrace,
            RevokesFamily: true
        );
    }

    public static void RevokeActiveTokens(
        IEnumerable<RefreshToken> refreshTokens,
        DateTimeOffset revokedAt
    )
    {
        foreach (RefreshToken refreshToken in refreshTokens.Where(token => token.RevokedAt is null))
        {
            refreshToken.RevokedAt = revokedAt;
        }
    }

    private static bool CanUseImmediatelyPreviousToken(
        RefreshToken previous,
        DateTimeOffset now,
        RefreshTokenOptions options
    ) =>
        previous.ReplacedByToken is not null
        && previous.RevokedAt is not null
        && now - previous.RevokedAt.Value <= TimeSpan.FromSeconds(options.RotationGraceSeconds)
        && previous.ReplacedByToken.ExpiresAt > now;
}

internal abstract record RefreshTokenFamilyRotationDecision
{
    private RefreshTokenFamilyRotationDecision() { }

    public sealed record RotateCurrent : RefreshTokenFamilyRotationDecision;

    public sealed record AcceptGrace(DateTimeOffset CurrentRefreshTokenExpiresAt)
        : RefreshTokenFamilyRotationDecision;

    public sealed record Reject(RefreshTokenRotationRejectionReason Reason, bool RevokesFamily)
        : RefreshTokenFamilyRotationDecision;
}
