Status: ready-for-agent

# Edit Unit details

## What to build

Build the end-to-end flow for Staff to update an existing Unit's descriptive and
pricing details. Staff should be able to correct the Unit name, short
description, guest capacity, and base price before availability or Bookings
exist.

## Acceptance criteria

- [ ] Staff can open an existing Unit and update its name, short description,
      guest capacity, base price amount, and currency.
- [ ] Unit money values continue to follow ADR 0006: integer minor units with
      explicit currency, initially constrained to `THB`.
- [ ] Updated Unit details are visible in the back-office Unit list after save.
- [ ] Unit edit API access is Staff-only.
- [ ] The slice includes focused server tests for edit behavior and Staff-only
      access.
- [ ] Photos, Unit kind/label, availability, and Bookings remain out of scope.

## Blocked by

- `.scratch/unit-management/issues/01-create-and-list-units.md`
