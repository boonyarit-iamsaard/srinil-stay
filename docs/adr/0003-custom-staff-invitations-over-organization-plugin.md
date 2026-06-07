# Custom `invitations` table instead of Better Auth's organization plugin

Status: accepted

## Decision

Staff are onboarded through a **hand-rolled `invitations` table and an
`invitations` feature slice** in the Hono API (`POST /invitations`,
`GET /invitations/:token`, `POST /invitations/accept`) — **not** through Better
Auth's `organization` plugin, even though that plugin ships an email-invitation
flow (invite/accept/reject and email hook) out of the box.

An existing Staff member supplies a name and email; the API stores a single-use,
token-bearing `Invitation` (12h expiry) and emails an accept link. The recipient
sets a password; acceptance creates the Better Auth user through the Better Auth
`admin` plugin's server-side `createUser` API and assigns `role = staff`. State
is implied by timestamps (`acceptedAt` null/set, vs `expiresAt`) rather than a
status enum.

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
- The custom table is small and owns its shape: `UNIQUE(email)` and upsert makes
  `POST /invitations` idempotent (resend rotates the token in place); an atomic
  conditional claim (`UPDATE … SET acceptedAt=now() WHERE acceptedAt IS NULL AND
expiresAt>now()`) plus the existing `UNIQUE(users.email)` constraint makes
  `POST /invitations/accept` safe against concurrent/retried accepts with no
  idempotency-key infrastructure.
- The Better Auth `admin` plugin is still useful for the final user-creation
  step: it creates the credential account and applies the application role in
  one server-side call, without adopting the organization plugin's tenancy
  model.

The convenience of a built-in flow is not worth importing a tenancy model our
own glossary bans.

## Considered and rejected

- **Better Auth `organization` plugin** — rejected: imports
  Organization/Member/Team tenancy concepts the domain forbids; invitations are
  tied to org membership, not Staff identity.
- **Better Auth `admin` plugin as the whole invitation flow** — rejected:
  Staff should still accept a token-bearing invitation and set their own
  password. The admin plugin is used only after the custom invitation has been
  claimed, to create the user with `role = staff`.

## Out of scope

Invite-permission gating (which Staff may invite) remains open. Bootstrap of the
first Staff member and removal of the back-office self-signup form are now
decided in
[ADR 0004](0004-bootstrap-first-staff-via-on-boot-invitation.md).
