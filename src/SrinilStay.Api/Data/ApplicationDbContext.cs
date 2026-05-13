using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace SrinilStay.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<IdentityUser, IdentityRole, string>(options)
{
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
