Status: ready-for-agent

# Deactivate and reactivate Units

## What to build

Build the end-to-end active-state management flow for Units. Staff should be
able to take a Unit out of sale and restore it later without hard deletion. The
Unit list should make active and inactive Units easy to distinguish.

## Acceptance criteria

- [ ] Staff can deactivate an active Unit without hard-deleting it.
- [ ] Staff can reactivate an inactive Unit.
- [ ] The back-office Unit list clearly distinguishes active and inactive Units.
- [ ] Active-state API access is Staff-only.
- [ ] The slice includes focused server tests for deactivate/reactivate behavior
      and Staff-only access.
- [ ] Reactivation does not manage date-specific availability.
- [ ] Photos, Unit kind/label, availability, and Bookings remain out of scope.

## Blocked by

- `.scratch/unit-management/issues/01-create-and-list-units.md`
