# Guest protected area uses a thin auth guard, not the back-office sidebar shell

Status: accepted

## Decision

In `apps/web` (the Guest app), the authenticated area (`/checkout`,
`/account/*`) is wrapped by a **thin, guard-only layout**: it checks the session
via Better-Auth's `useSession()` client hook, shows a loader while pending, and
redirects to `/login` when there is none — and adds **no chrome of its own**.

It deliberately does **not** reuse `apps/back-office`'s `_protected` shell
(`SidebarProvider` and `AppSidebar`). The back-office sidebar is an internal-tool
pattern; the Guest protected area uses the consumer top-nav instead — `/account`
renders inside the public site header (with an account menu), and `/checkout`
renders bare for a focused, distraction-free payment flow.

The route groups mirror back-office's three layouts:

| back-office (TanStack) | web (Next App Router)        | chrome                       |
| ---------------------- | ---------------------------- | ---------------------------- |
| `_auth`                | `app/(auth)/layout.tsx`      | centered card, no site shell |
| `_public`              | `app/(public)/layout.tsx`    | site header and footer       |
| `_protected`           | `app/(protected)/layout.tsx` | **guard only — no shell**    |

## Why this is worth recording

A future reader porting back-office auth to web would reasonably assume the
protected layouts should match — and "fix" the Guest app by copying the
sidebar dashboard shell. That would be wrong:

- **The sidebar is coupled to the internal-tool shape**, the exact asymmetry
  [ADR 0001](0001-split-guest-and-staff-frontends.md) says to preserve. Staff
  live in a dense, multi-section dashboard daily; a Guest visits a two-section
  account area (bookings, profile) rarely, on mobile, as a continuation of the
  public booking funnel. A left sidebar there reads as "I walked into an admin
  panel" and fights the consumer-site feel.
- **A single protected shell can't serve both protected routes.** Checkout wants
  _less_ chrome (no nav tempting the guest away — better conversion); account
  wants the normal site chrome to navigate back to browsing. So the
  `(protected)` layout imposes no shell; chrome is chosen per segment.
- **"Thin" means it adds auth, not layout.** The guard is the only shared
  concern across protected routes; everything visual is the consumer top-nav.

## Why the guard is client-side (and not `proxy.ts` / a Server Component)

Better-Auth's Next.js server patterns (`auth.api.getSession`, `proxy.ts`) need
the DB-backed auth instance _inside_ the Next app, or an HTTP `get-session` call
to Hono with forwarded cookies. The first contradicts ADR 0001 (Hono is the
single auth owner; `web` is a thin client with no DB creds); the second needs a
shared cookie domain between `web` and the API, which is out of scope for now.
The client `useSession()` guard works today over the existing cross-origin
credentialed setup that back-office already relies on, so it is the only
recommended option that fits — and a faithful mirror of back-office's
`_protected` `beforeLoad`.

## Considered and rejected

- **Reuse the back-office sidebar shell for the Guest protected area** —
  rejected: imports the internal-dashboard aesthetic into a consumer funnel and
  erases the deliberate asymmetry from ADR 0001.
- **One protected layout with a shared shell for checkout and account** —
  rejected: the two routes have opposite chrome needs.
- **`proxy.ts` / Server Component guard** — deferred: both depend on either a DB
  instance in `web` or the shared-cookie-domain decision, neither in scope now.

## Out of scope

The shared-cookie-domain / SSR-auth topology (which would later unlock
`proxy.ts` optimistic redirects and server-rendered authenticated pages),
role-based route authorization policy, and the concrete designs of the
`/account/*` and `/checkout` pages.
