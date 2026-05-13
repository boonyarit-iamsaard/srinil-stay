using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SrinilStay.Api.Data;
using Testcontainers.PostgreSql;

namespace SrinilStay.Api.Tests;

public abstract class AuthEndpointTestBase : IAsyncLifetime, IAsyncDisposable
{
    protected const string RefreshTokenCookieName = "srinil_stay_refresh_token";

    private readonly PostgreSqlContainer postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("srinil_stay_tests")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private AuthApiFactory? factory;
    private HttpClient? client;
    private bool disposed;

    protected HttpClient Http =>
        client ?? throw new InvalidOperationException("Test client is not initialized.");

    protected AuthApiFactory ApiFactory =>
        factory ?? throw new InvalidOperationException("API factory is not initialized.");

    public async Task InitializeAsync()
    {
        await postgres.StartAsync();

        factory = new AuthApiFactory(postgres.GetConnectionString());
        await factory.ApplyMigrationsAsync();

        client = factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        await DisposeAsyncCore();
    }

    ValueTask IAsyncDisposable.DisposeAsync() => new(DisposeAsyncCore());

    private async Task DisposeAsyncCore()
    {
        if (disposed)
        {
            return;
        }

        client?.Dispose();

        if (factory is not null)
        {
            await factory.DisposeAsync();
        }

        await postgres.DisposeAsync();
        disposed = true;
    }

    protected static HttpRequestMessage CreateRefreshRequest(string cookie) =>
        CreateCookieRequest(HttpMethod.Post, "/auth/refresh", cookie);

    protected static HttpRequestMessage CreateLogoutRequest(string cookie) =>
        CreateCookieRequest(HttpMethod.Post, "/auth/logout", cookie);

    protected static string GetRefreshCookie(HttpResponseMessage response)
    {
        string setCookieHeader = Assert.Single(
            GetSetCookieHeaders(response),
            header =>
                header.StartsWith($"{RefreshTokenCookieName}=", StringComparison.OrdinalIgnoreCase)
        );

        return setCookieHeader.Split(';', 2)[0];
    }

    protected static string[] GetSetCookieHeaders(HttpResponseMessage response) =>
        response.Headers.TryGetValues("Set-Cookie", out IEnumerable<string>? values)
            ? values.ToArray()
            : [];

    private static HttpRequestMessage CreateCookieRequest(
        HttpMethod method,
        string requestUri,
        string cookie
    )
    {
        HttpRequestMessage request = new(method, requestUri);
        request.Headers.Add("Cookie", cookie);

        return request;
    }

    protected sealed class AuthApiFactory(string postgresConnectionString)
        : WebApplicationFactory<Program>
    {
        private readonly MutableTimeProvider timeProvider = new(DateTimeOffset.UtcNow);

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Postgres", postgresConnectionString);
            builder.UseSetting("Jwt:Issuer", "SrinilStay.Api.Tests");
            builder.UseSetting("Jwt:Audience", "SrinilStay.Api.Tests");
            builder.UseSetting("Jwt:SigningKey", "srinil-stay-tests-signing-key-32-chars");
            builder.UseSetting("Jwt:AccessTokenMinutes", "15");

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<TimeProvider>();
                services.AddSingleton<TimeProvider>(timeProvider);
            });
        }

        public async Task ApplyMigrationsAsync()
        {
            using IServiceScope scope = Services.CreateScope();
            ApplicationDbContext dbContext =
                scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            await dbContext.Database.MigrateAsync();
        }

        public void AdvanceTime(TimeSpan duration) => timeProvider.Advance(duration);
    }

    private sealed class MutableTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        private DateTimeOffset utcNow = utcNow;

        public override DateTimeOffset GetUtcNow() => utcNow;

        public void Advance(TimeSpan duration) => utcNow = utcNow.Add(duration);
    }
}

internal sealed record AuthRequest(string Email, string Password);

internal sealed record TokenResponse(string AccessToken, string TokenType, int ExpiresIn);

internal sealed record CurrentUserResponse(
    string Id,
    string? Email,
    IReadOnlyCollection<string> Roles
);
