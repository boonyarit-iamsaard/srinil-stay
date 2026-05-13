WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

string postgresConnectionString =
    builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("Connection string 'Postgres' is not configured.");

builder.Services.AddOpenApi();
builder.Services.AddHealthChecks().AddNpgSql(postgresConnectionString, name: "postgres");

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapHealthChecks("/health");

await app.RunAsync();
