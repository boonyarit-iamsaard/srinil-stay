Status: ready-for-human

# Decide the server app composition seam

## What to build

Decide the shape of the server app composition seam for the Hono API. The
decision should say how runtime adapters such as database, auth, environment,
and mail are wired at boot and how tests should construct the server without
depending on hidden import order or global singleton timing.

## Acceptance criteria

- [x] The chosen composition shape is written down clearly enough for an AFK
      agent to implement later.
- [x] The decision preserves ADR 0001: Hono remains the single source of truth
      for business logic, Bookings, auth ownership, and payment webhooks.
- [x] The decision identifies which adapters are real today and which seams
      should not be introduced yet.
- [x] The decision explains how server tests should avoid relying on
      environment mutation before module imports.
- [x] No runtime behaviour needs to change in this slice.

## Blocked by

None - can start immediately
