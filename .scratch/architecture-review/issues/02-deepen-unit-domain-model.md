Status: ready-for-agent

# Deepen Unit as the Staff-managed domain model

## What to build

Deepen Unit as the Staff-managed domain model for the homestay's bookable
spaces. Unit should concentrate the rules for core Unit details, Money-backed
base price, and active/deactivated lifecycle while preserving the current
end-to-end Staff create, list, edit, deactivate, and reactivate flows.

## Acceptance criteria

- [ ] Staff can still create and list Units through the back-office app.
- [ ] Staff can still edit Unit name, short description, guest capacity, and
      base price.
- [ ] Staff can still deactivate and reactivate Units without hard deletion.
- [ ] Unit rules for required details, positive guest capacity, Money-backed
      base price, and active-state transitions are concentrated behind the Unit
      domain model rather than repeated across callers.
- [ ] Server tests exercise Unit behaviour through the Unit-facing interface and
      still cover Staff-only access through the Hono routes.
- [ ] Photos, Unit kind/label, date-specific availability, and Bookings remain
      out of scope.

## Blocked by

- `.scratch/architecture-review/issues/01-introduce-money-value-object.md`
