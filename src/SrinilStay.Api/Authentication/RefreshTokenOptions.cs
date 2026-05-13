using System.ComponentModel.DataAnnotations;

namespace SrinilStay.Api.Authentication;

public sealed class RefreshTokenOptions
{
    public const string SectionName = "RefreshTokens";

    [Required]
    public string CookieName { get; init; } = "srinil_stay_refresh_token";

    [Range(1, 365)]
    public int IdleLifetimeDays { get; init; } = 30;

    [Range(0, 300)]
    public int RotationGraceSeconds { get; init; } = 10;

    public static bool IsValid(RefreshTokenOptions options) =>
        !string.IsNullOrWhiteSpace(options.CookieName)
        && options.IdleLifetimeDays > 0
        && options.RotationGraceSeconds >= 0;
}
