# .NET Vertical Slice Modifiers

Note to self for Minimal API slices like `Features/Authentication/Login.cs`.

## Slice Module

Use a `public static class` named after the use case when another file maps it.

```csharp
namespace SrinilStay.Api.Features.Authentication;

public static class Login
```

- `public`: the route group mapper can call `Login.Map(...)`.
- `static`: the slice has no instance state; dependencies come from the endpoint handler.
- Keep this flat while the slice fits in one file; split into a folder only when the file becomes hard to scan.

## Slice Contracts

Use `public sealed record` for request and response DTOs nested in the slice.

```csharp
public sealed record Request(string Email, string Password);
public sealed record Response(string AccessToken, string TokenType, int ExpiresIn);
```

- `public`: keeps Minimal API, OpenAPI, JSON serialization, and validator discovery straightforward.
- `sealed`: request and response DTOs are data contracts, not inheritance points.
- Generic names are okay because the containing type and namespace already provide context: `Authentication.Login.Request`.

## Slice Validator

Use a `public sealed class` for a FluentValidation validator nested in the slice.

```csharp
public sealed class Validator : AbstractValidator<Request>
```

- `public`: `AddValidatorsFromAssemblyContaining<Program>()` can discover it reliably.
- `sealed`: validators are specific to one request shape; prefer composition over validator inheritance.

## Route Mapping

Use `public static` for the method that registers the route.

```csharp
public static void Map(IEndpointRouteBuilder endpoints)
```

- `public`: called by the feature or group mapper.
- `static`: route registration does not need an object instance.

## Handler Helpers

Use `private static` for endpoint handlers and small helper methods.

```csharp
private static async Task<IResult> Handler(...)
private static IResult InvalidLoginProblem()
```

- `private`: callers should map the route, not call the handler directly.
- `static`: dependencies are explicit handler parameters, so no hidden instance state is needed.

## Cancellation And Handler Parameter Count

Prefer keeping Minimal API handlers at seven parameters or fewer so they stay readable and avoid Sonar rule S107.
If the handler already receives `HttpContext`, use `httpContext.RequestAborted` instead of adding a separate `CancellationToken` parameter.

```csharp
private static async Task<IResult> Handler(..., HttpContext httpContext)
{
    ValidationResult result = await validator.ValidateAsync(request, httpContext.RequestAborted);
}
```

ASP.NET Core also binds a standalone `CancellationToken` to request cancellation automatically, but using `HttpContext.RequestAborted` is cleaner when `HttpContext` is already needed.
