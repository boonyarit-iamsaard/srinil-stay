using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SrinilStay.Api.Authentication;

namespace SrinilStay.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<IdentityUser, IdentityRole, string>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<IdentityUser>(entity =>
        {
            entity.ToTable("asp_net_users");
            entity
                .HasIndex(user => user.NormalizedEmail)
                .HasDatabaseName("ix_asp_net_users_normalized_email");
            entity
                .HasIndex(user => user.NormalizedUserName)
                .HasDatabaseName("ix_asp_net_users_normalized_user_name");
        });

        builder.Entity<IdentityRole>(entity =>
        {
            entity.ToTable("asp_net_roles");
            entity
                .HasIndex(role => role.NormalizedName)
                .HasDatabaseName("ix_asp_net_roles_normalized_name");
        });

        builder.Entity<IdentityUserClaim<string>>().ToTable("asp_net_user_claims");
        builder.Entity<IdentityUserLogin<string>>().ToTable("asp_net_user_logins");
        builder.Entity<IdentityUserRole<string>>().ToTable("asp_net_user_roles");
        builder.Entity<IdentityUserToken<string>>().ToTable("asp_net_user_tokens");
        builder.Entity<IdentityRoleClaim<string>>().ToTable("asp_net_role_claims");

        builder.Entity<RefreshToken>(entity =>
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
        });

        builder
            .Entity<IdentityRole>()
            .HasData(
                new IdentityRole
                {
                    Id = "admin-role",
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    ConcurrencyStamp = "admin-role",
                }
            );
    }
}
