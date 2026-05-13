# Srinil Stay

Srinil Stay manages stays and related access to the system. This context document captures the domain language used by the API.

## Language

**User**:
A person who can authenticate to the API.
_Avoid_: Guest, host, staff member, owner

## Relationships

- A **User** is an authentication actor, not yet a stay-specific role such as guest, host, staff member, or owner.

## Example dialogue

> **Dev:** "Should a **User** be created as a guest or host?"
> **Domain expert:** "No — for now a **User** only means someone who can authenticate to the API."

## Flagged ambiguities

- "user" could mean an authentication principal or a stay-domain actor — resolved: **User** means only an authentication actor for the current baseline.
