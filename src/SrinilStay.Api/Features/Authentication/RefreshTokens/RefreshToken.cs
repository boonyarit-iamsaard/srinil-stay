using Microsoft.AspNetCore.Identity;

namespace SrinilStay.Api.Features.Authentication.RefreshTokens;

public sealed class RefreshToken
{
    public Guid Id { get; init; }

    public Guid FamilyId { get; init; }

    public required string UserId { get; init; }

    public IdentityUser User { get; init; } = null!;

    public required string TokenHash { get; init; }

    public DateTimeOffset ExpiresAt { get; init; }

    public DateTimeOffset? RevokedAt { get; set; }

    public Guid? ReplacedByTokenId { get; set; }

    public RefreshToken? ReplacedByToken { get; set; }

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset? LastUsedAt { get; set; }
}
