# Agent Instructions

Before working in this repository, read `Makefile` first and use its targets as the preferred project interface.

Important targets:

- `make test` runs the test suite.
- `make format` applies C# formatting.
- `make format-check` checks C# formatting.
- `make build` builds the API and tests.
- `make up-infra` starts infrastructure only.
- `make down-infra` stops infrastructure only.

Prefer these targets over calling the underlying `dotnet`, `docker compose`, or formatter commands directly unless there is a specific reason to bypass the Makefile.
