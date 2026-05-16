using SrinilStay.Api.Features.Authentication.RefreshTokens;

namespace SrinilStay.Api.Tests.Features.Authentication.RefreshTokens;

public sealed class RefreshTokenFamilyTests
{
    private static readonly RefreshTokenOptions Options = new()
    {
        IdleLifetimeDays = 30,
        RotationGraceSeconds = 10,
    };

    [Fact]
    public void CurrentRefreshTokenRotates()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        RefreshToken refreshToken = CreateRefreshToken(now);

        RefreshTokenFamilyRotationDecision decision = RefreshTokenFamily.DecideRotation(
            refreshToken,
            now,
            Options
        );

        Assert.IsType<RefreshTokenFamilyRotationDecision.RotateCurrent>(decision);
    }

    [Fact]
    public void ExpiredRefreshTokenRevokesFamily()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        RefreshToken refreshToken = CreateRefreshToken(now, expiresAt: now);

        RefreshTokenFamilyRotationDecision decision = RefreshTokenFamily.DecideRotation(
            refreshToken,
            now,
            Options
        );

        RefreshTokenFamilyRotationDecision.Reject rejection =
            Assert.IsType<RefreshTokenFamilyRotationDecision.Reject>(decision);
        Assert.Equal(RefreshTokenRotationRejectionReason.ExpiredToken, rejection.Reason);
        Assert.True(rejection.RevokesFamily);
    }

    [Fact]
    public void ImmediatelyPreviousRefreshTokenInsideGraceIsAccepted()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        DateTimeOffset revokedAt = now.AddSeconds(-5);
        RefreshToken current = CreateRefreshToken(now);
        RefreshToken previous = CreateRefreshToken(
            now,
            revokedAt: revokedAt,
            replacedByToken: current
        );

        RefreshTokenFamilyRotationDecision decision = RefreshTokenFamily.DecideRotation(
            previous,
            now,
            Options
        );

        RefreshTokenFamilyRotationDecision.AcceptGrace grace =
            Assert.IsType<RefreshTokenFamilyRotationDecision.AcceptGrace>(decision);
        Assert.Equal(current.ExpiresAt, grace.CurrentRefreshTokenExpiresAt);
    }

    [Fact]
    public void ReusedRefreshTokenOutsideGraceRevokesFamily()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        RefreshToken previous = CreateRefreshToken(
            now,
            revokedAt: now.AddSeconds(-11),
            replacedByToken: CreateRefreshToken(now)
        );

        RefreshTokenFamilyRotationDecision decision = RefreshTokenFamily.DecideRotation(
            previous,
            now,
            Options
        );

        RefreshTokenFamilyRotationDecision.Reject rejection =
            Assert.IsType<RefreshTokenFamilyRotationDecision.Reject>(decision);
        Assert.Equal(RefreshTokenRotationRejectionReason.ReusedTokenOutsideGrace, rejection.Reason);
        Assert.True(rejection.RevokesFamily);
    }

    [Fact]
    public void RevokeActiveTokensDoesNotOverwriteAlreadyRevokedTokens()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        DateTimeOffset earlierRevocation = now.AddMinutes(-1);
        RefreshToken active = CreateRefreshToken(now);
        RefreshToken alreadyRevoked = CreateRefreshToken(now, revokedAt: earlierRevocation);

        RefreshTokenFamily.RevokeActiveTokens([active, alreadyRevoked], now);

        Assert.Equal(now, active.RevokedAt);
        Assert.Equal(earlierRevocation, alreadyRevoked.RevokedAt);
    }

    private static RefreshToken CreateRefreshToken(
        DateTimeOffset now,
        DateTimeOffset? expiresAt = null,
        DateTimeOffset? revokedAt = null,
        RefreshToken? replacedByToken = null
    ) =>
        new()
        {
            Id = Guid.NewGuid(),
            FamilyId = Guid.NewGuid(),
            UserId = Guid.NewGuid().ToString("N"),
            TokenHash = Guid.NewGuid().ToString("N"),
            CreatedAt = now,
            ExpiresAt = expiresAt ?? now.AddDays(30),
            RevokedAt = revokedAt,
            ReplacedByToken = replacedByToken,
        };
}
