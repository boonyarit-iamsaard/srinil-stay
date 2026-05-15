using System.ComponentModel.DataAnnotations;
using System.Text;

namespace SrinilStay.Api.Features.Authentication.Tokens;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public required string Issuer { get; init; }

    [Required]
    public required string Audience { get; init; }

    [Required]
    [MinLength(32)]
    public required string SigningKey { get; init; }

    [Range(1, 1440)]
    public int AccessTokenMinutes { get; init; } = 15;

    public static bool IsValid(JwtOptions options) =>
        !string.IsNullOrWhiteSpace(options.Issuer)
        && !string.IsNullOrWhiteSpace(options.Audience)
        && Encoding.UTF8.GetByteCount(options.SigningKey) >= 32
        && options.AccessTokenMinutes > 0;
}
