namespace SrinilStay.Api.Features.Authentication;

public static class AuthenticationEndpoints
{
    public static RouteGroupBuilder MapAuthenticationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        RouteGroupBuilder group = endpoints.MapGroup("/auth").WithTags("Authentication");

        Register.Map(group);
        Login.Map(group);
        Refresh.Map(group);
        Logout.Map(group);
        GetCurrentUser.Map(group);

        return group;
    }
}
