Status: ready-for-agent

# Create and list Units

## What to build

Build the first end-to-end Unit management path for Staff. Staff should be able
to create a Unit with its core attributes and see created Units in the
back-office Unit list. A Unit is the canonical bookable thing in the homestay;
do not introduce Room, House, or Property as separate domain models.

## Acceptance criteria

- [x] Staff can create a Unit with name, short description, guest capacity, base
      price in integer minor units, explicit currency, and an active default.
- [x] Unit money values follow ADR 0006: integer minor units with explicit
      currency, initially constrained to `THB`.
- [x] Staff can view a list of Units in the back-office app after creation.
- [x] Unit create/list API access is Staff-only.
- [x] The slice includes focused server tests for create/list behavior and
      Staff-only access.
- [x] Photos, Unit kind/label, availability, and Bookings remain out of scope.

## Blocked by

None - can start immediately
