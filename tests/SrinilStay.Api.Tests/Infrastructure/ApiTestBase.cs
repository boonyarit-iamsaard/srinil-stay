using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SrinilStay.Api.Data;
using Testcontainers.PostgreSql;

namespace SrinilStay.Api.Tests.Infrastructure;

public abstract class ApiTestBase : IAsyncLifetime, IAsyncDisposable
{
    private readonly PostgreSqlContainer postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("srinil_stay_tests")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private TestApiFactory? factory;
    private HttpClient? client;
    private bool disposed;

    protected HttpClient Http =>
        client ?? throw new InvalidOperationException("Test client is not initialized.");

    protected TestApiFactory ApiFactory =>
        factory ?? throw new InvalidOperationException("API factory is not initialized.");

    public async Task InitializeAsync()
    {
        await postgres.StartAsync();

        factory = new TestApiFactory(postgres.GetConnectionString());
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

    protected sealed class TestApiFactory(string postgresConnectionString)
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
