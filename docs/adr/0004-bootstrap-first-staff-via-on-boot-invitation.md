# Bootstrap the first Staff via a declarative on-boot invitation

Status: accepted

## Decision

The Hono server, on startup, reads `BOOTSTRAP_STAFF_EMAIL` /
`BOOTSTRAP_STAFF_NAME` (both optional — unset means skip) and issues a Staff
`Invitation` for that person by calling the existing `createInvitation` service
directly, **bypassing the `POST /invitations` session guard**. It no-ops if that
email already belongs to a user. This is how the **first** Staff comes into
being; once they accept, the normal Staff-issued invite chain takes over. The
step is **non-fatal** (a failed send logs and never blocks boot) and reuses the
existing **per-email** idempotency (the `UNIQUE(email)` upsert) — it is keyed on
the declared email, not on a "first Staff only" count.

## Why this is worth recording

This resolves a chicken-and-egg `POST /invitations` needs an authenticated
Staff session, but no Staff exists to create the first invitation
([ADR 0003](0003-custom-staff-invitations-over-organization-plugin.md) left this
out of scope). A future reader will see the server emailing an invitation on
boot and rotating a token, and reasonably ask _"why on boot? why not a one-off
script?"_ The answer is reachability: **the server is the only component
guaranteed to hold the DB and SMTP credentials and to reach both** — so the
bootstrap runs where the connectivity already exists, with no operator
credentials on a laptop and no extra infrastructure.

## Considered and rejected

- **Manual operator CLI** (the Django `createsuperuser` lineage) — rejected as
  the primary surface: clean and intent-explicit, but it needs the production
  DB and SMTP credentials wherever it is run, and the production DB reachable
  from there, which a managed Postgres typically is not from a laptop.
- **GitHub Actions `workflow_dispatch`** — rejected: a manually dispatched job
  with `email` / `name` inputs keeps secrets off the laptop and is audited, but
  a hosted runner's IP cannot reach a locked-down managed Postgres without a
  self-hosted runner or tunnel.
- **Declarative env admin with a baked password, or a `count == 0`
  first-only guard** — rejected: we key on the declared email and reuse the
  existing per-email idempotency, and we issue a claim link the recipient
  redeems to set their own password rather than storing a password in config.

## Consequences

- It is **per-email reconciliation**, not "first-Staff-only." Changing the env
  to a different person and redeploying will invite them even when Staff already
  exist — a deliberate "ensure this declared person is Staff," authorized by who
  can change deploy config.
- While an invitation is pending, **each restart rotates the token and
  invalidates the previously emailed link** — only the newest email is valid.
  Accepted because the operator is the immediate invitee and clicks the link
  right after the deploy that set the env.
- The env vars persist after the first Staff exists; if that Staff user is later
  deleted, the next boot re-invites them.
