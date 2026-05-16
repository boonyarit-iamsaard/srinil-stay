using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace SrinilStay.Api.Tests.Features.Authentication;

public sealed class RefreshTokenEndpointsTests : AuthenticationEndpointTestBase
{
    [Fact]
    public async Task RefreshRotatesRefreshTokenAndReturnsAccessToken()
    {
        AuthenticationRequest request = new($"user-{Guid.NewGuid():N}@example.com", "Password1!");

        HttpResponseMessage registerResponse = await Http.PostAsJsonAsync(
            "/auth/register",
            request
        );
        registerResponse.EnsureSuccessStatusCode();
        string originalCookie = GetRefreshCookie(registerResponse);

        using HttpRequestMessage refreshRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage refreshResponse = await Http.SendAsync(refreshRequest);
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
        AuthenticationRequest request = new($"user-{Guid.NewGuid():N}@example.com", "Password1!");

        HttpResponseMessage registerResponse = await Http.PostAsJsonAsync(
            "/auth/register",
            request
        );
        registerResponse.EnsureSuccessStatusCode();
        string originalCookie = GetRefreshCookie(registerResponse);

        using HttpRequestMessage refreshRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage refreshResponse = await Http.SendAsync(refreshRequest);
        refreshResponse.EnsureSuccessStatusCode();
        string rotatedCookie = GetRefreshCookie(refreshResponse);

        ApiFactory.AdvanceTime(TimeSpan.FromSeconds(30));

        using HttpRequestMessage reuseRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage reuseResponse = await Http.SendAsync(reuseRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, reuseResponse.StatusCode);

        using HttpRequestMessage currentRequest = CreateRefreshRequest(rotatedCookie);
        HttpResponseMessage currentResponse = await Http.SendAsync(currentRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, currentResponse.StatusCode);
    }

    [Fact]
    public async Task ReusingImmediatelyRotatedRefreshTokenWithinGraceDoesNotRevokeFamily()
    {
        AuthenticationRequest request = new($"user-{Guid.NewGuid():N}@example.com", "Password1!");

        HttpResponseMessage registerResponse = await Http.PostAsJsonAsync(
            "/auth/register",
            request
        );
        registerResponse.EnsureSuccessStatusCode();
        string originalCookie = GetRefreshCookie(registerResponse);

        using HttpRequestMessage refreshRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage refreshResponse = await Http.SendAsync(refreshRequest);
        refreshResponse.EnsureSuccessStatusCode();
        string rotatedCookie = GetRefreshCookie(refreshResponse);

        using HttpRequestMessage graceRequest = CreateRefreshRequest(originalCookie);
        HttpResponseMessage graceResponse = await Http.SendAsync(graceRequest);
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
        HttpResponseMessage currentResponse = await Http.SendAsync(currentRequest);

        currentResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task LogoutRevokesRefreshTokenFamilyAndClearsCookie()
    {
        AuthenticationRequest request = new($"user-{Guid.NewGuid():N}@example.com", "Password1!");

        HttpResponseMessage loginResponse = await Http.PostAsJsonAsync("/auth/register", request);
        loginResponse.EnsureSuccessStatusCode();
        string cookie = GetRefreshCookie(loginResponse);

        using HttpRequestMessage logoutRequest = CreateLogoutRequest(cookie);
        HttpResponseMessage logoutResponse = await Http.SendAsync(logoutRequest);

        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);
        Assert.Contains(
            GetSetCookieHeaders(logoutResponse),
            header =>
                header.StartsWith($"{RefreshTokenCookieName}=;", StringComparison.OrdinalIgnoreCase)
        );

        using HttpRequestMessage refreshRequest = CreateRefreshRequest(cookie);
        HttpResponseMessage refreshResponse = await Http.SendAsync(refreshRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
    }

    [Fact]
    public async Task MissingRefreshTokenReturnsProblemDetails()
    {
        HttpResponseMessage response = await Http.PostAsync("/auth/refresh", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        JsonElement problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unauthorized", problem.GetProperty("title").GetString());
        Assert.Equal(401, problem.GetProperty("status").GetInt32());
    }
}
