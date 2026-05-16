using SrinilStay.Api.Tests.Infrastructure;

namespace SrinilStay.Api.Tests.Features.Authentication;

public abstract class AuthenticationEndpointTestBase : ApiTestBase
{
    protected const string RefreshTokenCookieName = "srinil_stay_refresh_token";

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
}

internal sealed record AuthenticationRequest(string Email, string Password);

internal sealed record TokenResponse(string AccessToken, string TokenType, int ExpiresIn);

internal sealed record CurrentUserResponse(
    string Id,
    string? Email,
    IReadOnlyCollection<string> Roles
);
