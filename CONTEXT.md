# Srinil Stay

Srinil Stay manages stays and related access to the system. This context document captures the domain language used by the API.

## Language

**User**:
A person who can authenticate to the API.
_Avoid_: Guest, host, staff member, owner

**Refresh Token**:
A long-lived opaque credential in a **Refresh Token Family**.
_Avoid_: Long-lived JWT

**Refresh Token Family**:
A rotation lineage of **Refresh Tokens** issued for one remembered authentication by a **User**.
_Avoid_: Login session, device, account session

## Relationships

- A **User** is an authentication actor, not yet a stay-specific role such as guest, host, staff member, or owner.
- A **User** can have multiple active **Refresh Token Families**.
- A **Refresh Token Family** belongs to exactly one **User**.
- A **Refresh Token Family** has one current **Refresh Token**.
- A **Refresh Token Family** can be revoked when one of its **Refresh Tokens** is reused after rotation.
- Reusing the immediately previous **Refresh Token** inside the rotation grace period does not revoke the **Refresh Token Family**.

## Example dialogue

> **Dev:** "Should a **User** be created as a guest or host?"
> **Domain expert:** "No — for now a **User** only means someone who can authenticate to the API."

> **Dev:** "Can we make the **Refresh Token** a longer-lived JWT?"
> **Domain expert:** "No — a **Refresh Token** is an opaque credential in a **Refresh Token Family** that can be rotated and revoked server-side."

> **Dev:** "Should logging out one browser sign the **User** out everywhere?"
> **Domain expert:** "No — it revokes that browser's **Refresh Token Family**."

> **Dev:** "If an old **Refresh Token** is presented after rotation, should we just reject that token?"
> **Domain expert:** "No — revoke the whole **Refresh Token Family** and require that client to log in again."

> **Dev:** "If two browser tabs use the same **Refresh Token** at almost the same time, is that always compromise?"
> **Domain expert:** "No — allow the immediately previous **Refresh Token** during the rotation grace period, but treat older reuse as compromise."

## Flagged ambiguities

- "user" could mean an authentication principal or a stay-domain actor — resolved: **User** means only an authentication actor for the current baseline.
- "refresh token" could mean a long-lived JWT or an opaque server-side credential — resolved: **Refresh Token** means an opaque credential in a **Refresh Token Family**.
- "session" could mean a browser cookie, an access token lifetime, or a remembered authentication — resolved: use **Refresh Token Family** for the remembered authentication represented by a refresh-token rotation lineage.
