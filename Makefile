IMAGE_NAME := srinil-stay-api
SOLUTION := SrinilStay.slnx
API_PROJECT := src/SrinilStay.Api/SrinilStay.Api.csproj
TEST_PROJECT := tests/SrinilStay.Api.Tests/SrinilStay.Api.Tests.csproj

.DEFAULT_GOAL := help

.PHONY: run up up-build up-infra down down-infra down-clean restore tools test build publish clean docker-build format format-check help

run: ## Run the API locally
	dotnet run --project $(API_PROJECT)

up: ## Start the full stack (application and infrastructure)
	docker compose up -d --wait

up-build: ## Build and start the full stack
	docker compose up -d --wait --build

up-infra: ## Start infrastructure only (postgres and pgadmin)
	docker compose -f compose.yaml up -d --wait

down: ## Stop the full stack
	docker compose down

down-infra: ## Stop infrastructure only
	docker compose -f compose.yaml down

down-clean: ## Stop the full stack and remove volumes
	docker compose down -v

restore: ## Restore NuGet packages
	dotnet restore $(API_PROJECT)
	dotnet restore $(TEST_PROJECT)

tools: ## Restore local .NET tools
	dotnet tool restore

format: tools ## Apply C# formatting
	dotnet csharpier format .

format-check: tools ## Check C# formatting
	dotnet csharpier check .

test: ## Run tests
	dotnet test $(TEST_PROJECT)

build: ## Build the application and tests
	dotnet build $(API_PROJECT)
	dotnet build $(TEST_PROJECT)

publish: ## Publish the API in Release configuration
	dotnet publish $(API_PROJECT) --configuration Release --output artifacts/publish

clean: ## Clean build artifacts
	dotnet clean $(API_PROJECT)
	dotnet clean $(TEST_PROJECT)

docker-build: ## Build Docker image tagged as local-production
	docker build --tag $(IMAGE_NAME):local-production .

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'
