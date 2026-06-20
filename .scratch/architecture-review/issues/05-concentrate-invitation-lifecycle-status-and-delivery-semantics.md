Status: ready-for-agent

# Concentrate Invitation lifecycle status and delivery semantics

## What to build

Concentrate the edge semantics around the existing custom Staff Invitation
lifecycle. The core Invitation behaviour should remain: Staff issue
single-use, token-bearing Invitations; invitees resolve and accept them; and
bootstrap first Staff remains best-effort. Status meanings, HTTP/UI mapping,
and email delivery rendering should become easier to test through the
Invitation-facing interface.

## Acceptance criteria

- [x] Staff can still send or resend an Invitation from the back-office app.
- [x] Invitees can still resolve a valid Invitation token and accept it by
      setting a password.
- [x] Accepted, expired, missing, and existing-user Invitation outcomes have one
      concentrated status vocabulary that routes and Staff UI can map from.
- [x] Invitation email rendering and accept-link construction are covered by
      focused tests.
- [x] First-Staff bootstrap remains best-effort and still does not block server
      boot on delivery failure.
- [x] The implementation does not adopt Better Auth's organization plugin or
      introduce Organization, Member, or Team tenancy concepts.

## Blocked by

None - can start immediately
