using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SrinilStay.Api.Data;
using Testcontainers.PostgreSql;

namespace SrinilStay.Api.Tests;

public sealed class AuthEndpointsTests : IAsyncLifetime, IDisposable
{
    private readonly PostgreSqlContainer postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("srinil_stay_tests")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private AuthApiFactory? factory;
    private HttpClient? client;

    [Fact]
    public async Task RegisteredUserCanLoginAndReadCurrentUser()
    {
        HttpClient http =
            client ?? throw new InvalidOperationException("Test client is not initialized.");
        string email = $"user-{Guid.NewGuid():N}@example.com";
        AuthRequest request = new(email, "Password1!");

        HttpResponseMessage registerResponse = await http.PostAsJsonAsync(
            "/auth/register",
            request
        );
        registerResponse.EnsureSuccessStatusCode();

        TokenResponse? registerToken =
            await registerResponse.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(registerToken);
        Assert.Equal("Bearer", registerToken.TokenType);
        Assert.False(string.IsNullOrWhiteSpace(registerToken.AccessToken));

        HttpResponseMessage loginResponse = await http.PostAsJsonAsync("/auth/login", request);
        loginResponse.EnsureSuccessStatusCode();

        TokenResponse? loginToken = await loginResponse.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(loginToken);

        using HttpRequestMessage meRequest = new(HttpMethod.Get, "/auth/me");
        meRequest.Headers.Authorization = new("Bearer", loginToken.AccessToken);

        HttpResponseMessage meResponse = await http.SendAsync(meRequest);
        meResponse.EnsureSuccessStatusCode();

        CurrentUserResponse? currentUser =
            await meResponse.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.NotNull(currentUser);
        Assert.Equal(email, currentUser.Email);
        Assert.Empty(currentUser.Roles);
    }

    [Fact]
    public async Task MissingBearerTokenReturnsProblemDetails()
    {
        HttpClient http =
            client ?? throw new InvalidOperationException("Test client is not initialized.");

        HttpResponseMessage response = await http.GetAsync("/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        JsonElement problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unauthorized", problem.GetProperty("title").GetString());
        Assert.Equal(401, problem.GetProperty("status").GetInt32());
    }

    public async Task InitializeAsync()
    {
        await postgres.StartAsync();

        factory = new AuthApiFactory(postgres.GetConnectionString());
        await factory.ApplyMigrationsAsync();

        client = factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        client?.Dispose();

        if (factory is not null)
        {
            await factory.DisposeAsync();
        }

        await postgres.DisposeAsync();
    }

    public void Dispose()
    {
        client?.Dispose();
        factory?.Dispose();
    }

    private sealed record AuthRequest(string Email, string Password);

    private sealed record TokenResponse(string AccessToken, string TokenType);

    private sealed record CurrentUserResponse(
        string Id,
        string? Email,
        IReadOnlyCollection<string> Roles
    );

    private sealed class AuthApiFactory(string postgresConnectionString)
        : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Postgres", postgresConnectionString);
            builder.UseSetting("Jwt:Issuer", "SrinilStay.Api.Tests");
            builder.UseSetting("Jwt:Audience", "SrinilStay.Api.Tests");
            builder.UseSetting("Jwt:SigningKey", "srinil-stay-tests-signing-key-32-chars");
            builder.UseSetting("Jwt:AccessTokenMinutes", "15");
        }

        public async Task ApplyMigrationsAsync()
        {
            using IServiceScope scope = Services.CreateScope();
            ApplicationDbContext dbContext =
                scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            await dbContext.Database.MigrateAsync();
        }
    }
}
