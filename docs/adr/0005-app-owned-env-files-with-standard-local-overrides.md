# App-owned env files with standard local overrides

Status: accepted

## Decision

Each app owns its own env contract through `apps/*/.env.example`, and those
examples must stay runnable with safe local/CI defaults. Developer-specific
values live in ignored framework-standard files such as `apps/*/.env.local`.
GitHub Actions copies each app example to that app's `.env` instead of
maintaining a separate CI env profile. The production-like Compose server image
uses `apps/server/.env.production.local`, copied locally from the committed
`apps/server/.env.production.example`, so Compose has one prod-like server
configuration surface instead of hard-coded environment overrides.

## Why this is worth recording

Env configuration spans the Next Guest app, the Vite Staff app, the Hono server,
CI, containers, and the production-like server image. A root `.env.ci` or custom
profile filename would be tempting, but it would bypass the standard Next/Vite
`.env*` conventions and create another source of truth. Keeping env contracts
with the apps makes ownership clear, while `.env.production.local` preserves the
standard "production mode, local machine values" naming for the prod-like
Compose path.

## Considered and rejected

- **Root `.env.ci` / `.env.ci.example`** — rejected: CI would need custom copy
  or loader behavior anyway, and the values would drift from each app's own env
  contract.
- **`.env.local.production`** — rejected: it reverses the conventional
  `.env.[mode].local` naming used by Next and Vite.
- **Compose hard-coded env overrides** — rejected: container-specific hostnames
  belong in the prod-like server env file, not split between the env file and
  Compose YAML.
