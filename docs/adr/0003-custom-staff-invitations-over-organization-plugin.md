# Custom `invitations` table instead of Better Auth's organization plugin

Status: accepted

## Decision

Staff are onboarded through a **hand-rolled `invitations` table and an
`invitations` feature slice** in the Hono API (`POST /invitations`,
`GET /invitations/:token`, `POST /invitations/accept`) — **not** through Better
Auth's `organization` plugin, even though that plugin ships an email-invitation
flow (invite/accept/reject + email hook) out of the box.

An existing Staff member supplies a name + email; the API stores a single-use,
token-bearing `Invitation` (12h expiry) and emails an accept link. The recipient
sets a password; acceptance creates the Better Auth user. State is implied by
timestamps (`acceptedAt` null/set, vs `expiresAt`) rather than a status enum.

## Why this is worth recording

A future reader will see invitation logic reimplemented by hand and reasonably
ask: _"Better Auth already has invitations in the organization plugin — why not
just use it?"_ They might "fix" this by adopting the plugin. That would be wrong:

- The `organization` plugin models **Organizations / Members / Teams** — a
  multi-tenant shape. [CONTEXT.md](../../CONTEXT.md) is emphatic that Srinil Stay
  is **one homestay, not a tenant or a collection of properties**. Adopting the
  plugin means introducing org/member tables that would only ever hold a single
  org, and reasoning about every user through a tenancy lens the domain
  explicitly forbids.
- The plugin's invitations are coupled to _org membership_, not to "becoming
  Staff." We'd be bending its mental model permanently to fit a concept it
  doesn't represent.
- The custom table is small and owns its shape: `UNIQUE(email)` + upsert makes
  `POST /invitations` idempotent (resend rotates the token in place); an atomic
  conditional claim (`UPDATE … SET acceptedAt=now() WHERE acceptedAt IS NULL AND
expiresAt>now()`) plus the existing `UNIQUE(users.email)` constraint makes
  `POST /invitations/accept` safe against concurrent/retried accepts with no
  idempotency-key infrastructure.

The convenience of a built-in flow is not worth importing a tenancy model our
own glossary bans.

## Considered and rejected

- **Better Auth `organization` plugin** — rejected: imports
  Organization/Member/Team tenancy concepts the domain forbids; invitations are
  tied to org membership, not Staff identity.
- **Better Auth `admin` plugin `createUser`** — rejected: pulls in the
  admin/roles surface (out of scope here) and emails a temporary password
  instead of a token-then-set-own-password accept flow.

## Out of scope

Bootstrap of the first Staff member, removal of the back-office self-signup form
(gated on bootstrap completion), the `role` (`guest | staff`) column from
[ADR 0001](0001-split-guest-and-staff-frontends.md), and invite-permission
gating (who is allowed to invite).
