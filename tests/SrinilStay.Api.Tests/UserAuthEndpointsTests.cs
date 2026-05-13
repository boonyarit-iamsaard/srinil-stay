using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace SrinilStay.Api.Tests;

public sealed class UserAuthEndpointsTests : AuthEndpointTestBase
{
    [Fact]
    public async Task RegisteredUserCanLoginAndReadCurrentUser()
    {
        string email = $"user-{Guid.NewGuid():N}@example.com";
        AuthRequest request = new(email, "Password1!");

        HttpResponseMessage registerResponse = await Http.PostAsJsonAsync(
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

        HttpResponseMessage loginResponse = await Http.PostAsJsonAsync("/auth/login", request);
        loginResponse.EnsureSuccessStatusCode();

        TokenResponse? loginToken = await loginResponse.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(loginToken);
        Assert.Equal(900, loginToken.ExpiresIn);
        Assert.False(string.IsNullOrWhiteSpace(GetRefreshCookie(loginResponse)));

        using HttpRequestMessage meRequest = new(HttpMethod.Get, "/auth/me");
        meRequest.Headers.Authorization = new("Bearer", loginToken.AccessToken);

        HttpResponseMessage meResponse = await Http.SendAsync(meRequest);
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
        HttpResponseMessage response = await Http.GetAsync("/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        JsonElement problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unauthorized", problem.GetProperty("title").GetString());
        Assert.Equal(401, problem.GetProperty("status").GetInt32());
    }
}
