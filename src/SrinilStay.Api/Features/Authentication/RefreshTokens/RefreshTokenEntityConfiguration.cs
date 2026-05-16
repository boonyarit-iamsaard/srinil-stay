using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SrinilStay.Api.Features.Authentication.RefreshTokens;

internal sealed class RefreshTokenEntityConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> entity)
    {
        entity.ToTable("refresh_tokens");
        entity.HasKey(refreshToken => refreshToken.Id);
        entity
            .HasIndex(refreshToken => refreshToken.TokenHash)
            .IsUnique()
            .HasDatabaseName("ix_refresh_tokens_token_hash");
        entity
            .HasIndex(refreshToken => refreshToken.FamilyId)
            .HasDatabaseName("ix_refresh_tokens_family_id");
        entity
            .HasIndex(refreshToken => refreshToken.UserId)
            .HasDatabaseName("ix_refresh_tokens_user_id");
        entity
            .HasIndex(refreshToken => refreshToken.ReplacedByTokenId)
            .HasDatabaseName("ix_refresh_tokens_replaced_by_token_id");
        entity.Property(refreshToken => refreshToken.TokenHash).HasMaxLength(64);
        entity
            .HasOne(refreshToken => refreshToken.User)
            .WithMany()
            .HasForeignKey(refreshToken => refreshToken.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_refresh_tokens_asp_net_users_user_id");
        entity
            .HasOne(refreshToken => refreshToken.ReplacedByToken)
            .WithMany()
            .HasForeignKey(refreshToken => refreshToken.ReplacedByTokenId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_refresh_tokens_refresh_tokens_replaced_by_token_id");
    }
}
