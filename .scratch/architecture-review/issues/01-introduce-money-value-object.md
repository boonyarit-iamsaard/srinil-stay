Status: ready-for-agent

# Introduce Money as a value object

## What to build

Introduce Money as a value object for Srinil Stay money-shaped values. Money
should own the integer minor-unit and explicit-currency invariants from ADR
0006, initially constrained to Thai baht (`THB`), and should be usable by the
existing Staff Unit price path without changing Staff-visible behaviour.

## Acceptance criteria

- [x] Money represents an amount in integer minor units with an explicit
      currency.
- [x] Money accepts only supported Srinil Stay currencies, initially `THB`.
- [x] Money rejects fractional minor-unit values and non-positive Unit base
      prices where the current Unit flow rejects them today.
- [x] The Staff Unit create/edit flow still displays and submits base prices in
      whole baht while persisting integer minor units.
- [x] Focused tests cover Money parsing, validation, and display conversion edge
      cases.
- [x] Booking, payment-provider integration, discounts, and multi-currency
      expansion remain out of scope.

## Blocked by

None - can start immediately
