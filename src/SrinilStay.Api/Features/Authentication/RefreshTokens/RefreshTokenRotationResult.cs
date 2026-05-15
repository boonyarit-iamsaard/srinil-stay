using Microsoft.AspNetCore.Identity;

namespace SrinilStay.Api.Features.Authentication.RefreshTokens;

public abstract record RefreshTokenRotationResult
{
    private RefreshTokenRotationResult() { }

    public sealed record Rotated(IdentityUser User, IssuedRefreshToken RefreshToken)
        : RefreshTokenRotationResult;

    public sealed record GraceAccepted(
        IdentityUser User,
        DateTimeOffset CurrentRefreshTokenExpiresAt
    ) : RefreshTokenRotationResult;

    public sealed record Rejected(RefreshTokenRotationRejectionReason Reason)
        : RefreshTokenRotationResult;
}

public enum RefreshTokenRotationRejectionReason
{
    UnknownToken,
    ExpiredToken,
    MissingUser,
    ReusedTokenOutsideGrace,
}
