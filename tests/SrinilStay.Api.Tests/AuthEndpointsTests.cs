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
    private const string RefreshTokenCookieName = "srinil_stay_refresh_token";

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
        Assert.Equal(900, registerToken.ExpiresIn);
        Assert.False(string.IsNullOrWhiteSpace(registerToken.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(GetRefreshCookie(registerResponse)));

        HttpResponseMessage loginResponse = await http.PostAsJsonAsync("/auth/login", request);
        loginResponse.EnsureSuccessStatusCode();

        TokenResponse? loginToken = await loginResponse.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(loginToken);
        Assert.Equal(900, loginToken.ExpiresIn);
        Assert.False(string.IsNullOrWhiteSpace(GetRefreshCookie(loginResponse)));

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
    public async Task RefreshRotatesRefreshTokenAndReturnsAccessToken()
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
        string originalCookie = GetRefreshCookie(registerResponse);

        using HttpRequestMessage refreshRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage refreshResponse = await http.SendAsync(refreshRequest);
        refreshResponse.EnsureSuccessStatusCode();

        TokenResponse? refreshToken =
            await refreshResponse.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(refreshToken);
        Assert.Equal("Bearer", refreshToken.TokenType);
        Assert.Equal(900, refreshToken.ExpiresIn);
        Assert.False(string.IsNullOrWhiteSpace(refreshToken.AccessToken));

        string rotatedCookie = GetRefreshCookie(refreshResponse);
        Assert.NotEqual(originalCookie, rotatedCookie);
    }

    [Fact]
    public async Task ReusingRotatedRefreshTokenAfterGraceRevokesFamily()
    {
        HttpClient http =
            client ?? throw new InvalidOperationException("Test client is not initialized.");
        AuthApiFactory apiFactory =
            factory ?? throw new InvalidOperationException("API factory is not initialized.");
        string email = $"user-{Guid.NewGuid():N}@example.com";
        AuthRequest request = new(email, "Password1!");

        HttpResponseMessage registerResponse = await http.PostAsJsonAsync(
            "/auth/register",
            request
        );
        registerResponse.EnsureSuccessStatusCode();
        string originalCookie = GetRefreshCookie(registerResponse);

        using HttpRequestMessage refreshRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage refreshResponse = await http.SendAsync(refreshRequest);
        refreshResponse.EnsureSuccessStatusCode();
        string rotatedCookie = GetRefreshCookie(refreshResponse);

        await apiFactory.MoveRotatedTokenOutsideGracePeriodAsync();

        using HttpRequestMessage reuseRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage reuseResponse = await http.SendAsync(reuseRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, reuseResponse.StatusCode);

        using HttpRequestMessage currentRequest = CreateRefreshRequest(rotatedCookie);
        HttpResponseMessage currentResponse = await http.SendAsync(currentRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, currentResponse.StatusCode);
    }

    [Fact]
    public async Task ReusingImmediatelyRotatedRefreshTokenWithinGraceDoesNotRevokeFamily()
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
        string originalCookie = GetRefreshCookie(registerResponse);

        using HttpRequestMessage refreshRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage refreshResponse = await http.SendAsync(refreshRequest);
        refreshResponse.EnsureSuccessStatusCode();
        string rotatedCookie = GetRefreshCookie(refreshResponse);

        using HttpRequestMessage graceRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage graceResponse = await http.SendAsync(graceRequest);
        graceResponse.EnsureSuccessStatusCode();

        TokenResponse? graceToken = await graceResponse.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(graceToken);
        Assert.False(string.IsNullOrWhiteSpace(graceToken.AccessToken));
        Assert.DoesNotContain(
            GetSetCookieHeaders(graceResponse),
            header =>
                header.StartsWith($"{RefreshTokenCookieName}=", StringComparison.OrdinalIgnoreCase)
        );

        using HttpRequestMessage currentRequest = CreateRefreshRequest(rotatedCookie);
        HttpResponseMessage currentResponse = await http.SendAsync(currentRequest);

        currentResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task LogoutRevokesRefreshTokenFamilyAndClearsCookie()
    {
        HttpClient http =
            client ?? throw new InvalidOperationException("Test client is not initialized.");
        string email = $"user-{Guid.NewGuid():N}@example.com";
        AuthRequest request = new(email, "Password1!");

        HttpResponseMessage loginResponse = await http.PostAsJsonAsync("/auth/register", request);
        loginResponse.EnsureSuccessStatusCode();
        string cookie = GetRefreshCookie(loginResponse);

        using HttpRequestMessage logoutRequest = CreateLogoutRequest(cookie);
        HttpResponseMessage logoutResponse = await http.SendAsync(logoutRequest);

        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);
        Assert.Contains(
            GetSetCookieHeaders(logoutResponse),
            header =>
                header.StartsWith($"{RefreshTokenCookieName}=;", StringComparison.OrdinalIgnoreCase)
        );

        using HttpRequestMessage refreshRequest = CreateRefreshRequest(cookie);
        HttpResponseMessage refreshResponse = await http.SendAsync(refreshRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
    }

    [Fact]
    public async Task MissingRefreshTokenReturnsProblemDetails()
    {
        HttpClient http =
            client ?? throw new InvalidOperationException("Test client is not initialized.");

        HttpResponseMessage response = await http.PostAsync("/auth/refresh", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        JsonElement problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unauthorized", problem.GetProperty("title").GetString());
        Assert.Equal(401, problem.GetProperty("status").GetInt32());
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

    private static HttpRequestMessage CreateRefreshRequest(string cookie) =>
        CreateCookieRequest(HttpMethod.Post, "/auth/refresh", cookie);

    private static HttpRequestMessage CreateLogoutRequest(string cookie) =>
        CreateCookieRequest(HttpMethod.Post, "/auth/logout", cookie);

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

    private static string GetRefreshCookie(HttpResponseMessage response)
    {
        string setCookieHeader = Assert.Single(
            GetSetCookieHeaders(response),
            header =>
                header.StartsWith($"{RefreshTokenCookieName}=", StringComparison.OrdinalIgnoreCase)
        );

        return setCookieHeader.Split(';', 2)[0];
    }

    private static string[] GetSetCookieHeaders(HttpResponseMessage response) =>
        response.Headers.TryGetValues("Set-Cookie", out IEnumerable<string>? values)
            ? values.ToArray()
            : [];

    private sealed record TokenResponse(string AccessToken, string TokenType, int ExpiresIn);

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

        public async Task MoveRotatedTokenOutsideGracePeriodAsync()
        {
            using IServiceScope scope = Services.CreateScope();
            ApplicationDbContext dbContext =
                scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            DateTimeOffset outsideGracePeriod = DateTimeOffset.UtcNow.AddSeconds(-30);
            await dbContext
                .RefreshTokens.Where(refreshToken => refreshToken.ReplacedByTokenId != null)
                .ExecuteUpdateAsync(updates =>
                    updates.SetProperty(refreshToken => refreshToken.RevokedAt, outsideGracePeriod)
                );
        }
    }
}
