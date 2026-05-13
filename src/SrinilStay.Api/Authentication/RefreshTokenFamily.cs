namespace SrinilStay.Api.Authentication;

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

    public static bool CanUseImmediatelyPreviousToken(
        RefreshToken previous,
        DateTimeOffset now,
        RefreshTokenOptions options
    ) =>
        previous.ReplacedByToken is not null
        && previous.RevokedAt is not null
        && now - previous.RevokedAt.Value <= TimeSpan.FromSeconds(options.RotationGraceSeconds)
        && previous.ReplacedByToken.ExpiresAt > now;
}
