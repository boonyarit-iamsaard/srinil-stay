FROM mcr.microsoft.com/dotnet/sdk:10.0.203 AS build

WORKDIR /workspace

COPY .editorconfig Directory.Build.props Directory.Packages.props global.json ./
COPY src/SrinilStay.Api/SrinilStay.Api.csproj src/SrinilStay.Api/

RUN dotnet restore src/SrinilStay.Api/SrinilStay.Api.csproj

COPY src/ src/

RUN dotnet publish src/SrinilStay.Api/SrinilStay.Api.csproj \
  --configuration Release \
  --no-restore \
  --output /app/publish


FROM mcr.microsoft.com/dotnet/aspnet:10.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080

COPY --from=build /app/publish .

USER $APP_UID

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl --fail --silent --show-error http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "SrinilStay.Api.dll"]
