# Compose the Hono server through an explicit app factory

Status: accepted

## Decision

`apps/server` should expose an explicit Hono app composition function, for
example `createServerApp(dependencies)`, and keep the executable boot file as a
thin adapter that loads runtime configuration, constructs real adapters, runs
boot-only work, and calls `serve`.

Hono remains the single source of truth for Srinil Stay business logic,
Bookings, auth ownership, and payment webhooks, as decided in
[ADR 0001](0001-split-guest-and-staff-frontends.md). The seam is only the
boundary between "compose the API" and "start the Node process"; it is not a
move of business logic into another runtime.

The real adapters today are:

- **Environment**: the parsed server env from `@srinil-stay/env/server`,
  including CORS and bootstrap Staff settings.
- **Auth**: the Better-Auth server instance from `@srinil-stay/auth`, mounted at
  `/api/auth/*`.
- **Database**: the Drizzle connection used by feature services.
- **Mail**: the SMTP-backed mailer used by Staff invitation delivery.
- **Boot task**: first-Staff invitation bootstrap from ADR 0004.

The first implementation should introduce only the seams needed to remove
hidden import-order coupling:

- Build and export the Hono app from a pure composition module.
- Start the HTTP listener from a separate boot module.
- Pass env and auth into app composition instead of importing them from the
  entrypoint path that tests also need.
- Keep feature routes mounted by Hono as they are today.
- Keep bootstrap Staff outside app composition because it is a process boot
  side effect, not request handling.

Do **not** introduce repository interfaces, unit-of-work abstractions, a service
container, route auto-discovery, or fake mail/auth adapters yet. Those seams are
not justified by current behavior. Database and mail can stay as their current
module-level implementations until tests or production requirements need
per-test replacement.

## Why this is worth recording

The current server entrypoint both composes the Hono API and starts the Node
listener. Tests avoid importing that entrypoint because it eagerly imports
modules that construct global db/auth singletons from environment. The test
suite currently relies on Vitest setup file order to mutate `DATABASE_URL`
before any app module is imported. That works, but it is fragile: a harmless
import in the wrong setup file can point the process at the wrong database.

The app factory gives tests a public way to construct the API after their
ephemeral Postgres URL is known, without starting a socket and without relying
on "import this file only after env mutation" as an implicit contract.

## Testing guidance

Server tests should construct the Hono app through the composition function and
call `app.request(...)` or `app.fetch(...)`. Tests that need Postgres should
start the Testcontainers database, apply schema, then create the app with env
and adapters that point at that database. They should not import the executable
boot file.

Tests may still use the real Hono routes and real Drizzle-backed services. The
goal is not to mock business logic; it is to make process boot explicit enough
that test setup does not depend on environment mutation before hidden imports.

Staff-only access should continue to be verified through Hono routes. Feature
domain behavior should continue to be exercised through the Unit-, Invitation-,
or Booking-facing interfaces rather than by testing private route internals.

## Considered and rejected

- **Keep the combined entrypoint and rely on setup-file order** — rejected:
  import order is an implicit dependency that becomes harder to reason about as
  server features and tests grow.
- **Full dependency-injection container** — rejected: the app has a small number
  of real adapters, and a container would add indirection before there are
  competing implementations.
- **Repository interfaces for every feature** — rejected: current tests can use
  real Postgres through Testcontainers, and abstracting Drizzle now would mostly
  duplicate its API.
- **Mock auth and mail everywhere** — rejected: auth ownership is part of the
  Hono API boundary, and mail is only a real adapter where invitation delivery
  needs it. Introduce targeted fakes later only where tests need to observe
  delivery without SMTP.

## Consequences

- Runtime behavior does not need to change when this ADR is introduced.
- A later implementation can split app composition from process boot in a small,
  mechanical refactor.
- Tests get a stable construction seam while preserving end-to-end route
  behavior.
- Boot-only work such as first-Staff bootstrap stays outside request handling
  and remains non-fatal.
