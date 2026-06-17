Status: ready-for-agent

# Move Staff role vocabulary out of database schema ownership

## What to build

Move the shared Guest and Staff role vocabulary to a module that is not owned by
the database schema. The server auth setup, Staff-only Hono access checks, and
back-office Staff route guard should all use the same role contract without
requiring frontend code to import database schema modules.

## Acceptance criteria

- [x] Guest and Staff role names are defined once in a shared non-database
      contract.
- [x] The Better Auth configuration still defaults new users to Guest and treats
      Staff as the admin role.
- [x] Staff-only Hono routes still reject unauthenticated callers and
      authenticated Guests.
- [x] The back-office protected route guard no longer copies the `"staff"`
      literal inline.
- [x] The Guest app remains a thin Guest-facing client and does not gain Staff
      shell or Staff-only route behaviour.
- [x] Existing role-related tests continue to pass or are updated to assert the
      shared role contract.

## Blocked by

None - can start immediately
