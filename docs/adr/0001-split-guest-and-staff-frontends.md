# Split the customer (Guest) and Staff frontends into two apps

Status: accepted

## Decision

Srinil Stay is served by **two frontend apps over one shared Hono API**:

- `apps/web` — the **Guest**-facing booking funnel (discover → book → pay).
  Built with **Next.js (SSR)** because it must be indexed by Google, render
  fast on mobile, and produce good link/OG previews — none of which a
  client-rendered SPA delivers well.
- `apps/back-office` — the internal **Staff** operations app (formerly
  `apps/web`). Stays a **Vite + TanStack Router SPA**, which is the right shape
  for an authenticated internal dashboard with no SEO needs.
- `apps/server` (Hono) remains the **single source of truth** for all business
  logic, bookings, and payment webhooks. Both frontends are thin clients.

Guests and Staff share **one Better-Auth user pool** distinguished by a
`role` (`guest | staff`); each app surfaces only its own sign-in flows.

## Why this is worth recording

The resulting code looks deliberately _asymmetric_ in ways a future reader would
otherwise question and might "fix" wrongly:

- **Why two apps, one SSR and one SPA?** The split is driven by a real
  shape mismatch — a public, SEO-critical booking funnel vs. an internal
  dashboard — not by accident or tech debt. Merging them would force the admin
  dashboard's auth/runtime onto the public app, or strip SSR from the funnel.
- **Why Next _and_ Vite/TanStack in the same repo?** Next is chosen for the
  Guest app for its SSR/SEO maturity, image optimization (a photo-heavy
  ~10-unit homestay), and payment ecosystem — and because the author has deep
  Next experience. The genuinely shared code (`packages/ui`, the auth client,
  domain types) is framework-agnostic React, so it ports across both with no
  duplication; only the route trees differ, and those would not be shared
  anyway.
- **Why does the Next app not own its business logic?** Hono is the single API
  on purpose. The Next/SSR server is presentation-only and calls Hono; this
  keeps booking/payment logic in one runtime instead of smeared across two.
- **Why one user pool instead of two?** At this scale (one homestay, ~10 units,
  a few staff), a `role` field gates access cleanly. Two separate auth stores
  would double the wiring for isolation that role-gating already provides.

## Considered and rejected

- **One app with public + protected route groups** — rejected: can't give the
  public funnel SSR/SEO without imposing it (and the admin auth surface) on the
  whole app.
- **TanStack Start for the Guest app** (one ecosystem across both apps) —
  rejected: the only thing Start would unify is routing, which isn't shared
  between Guest and Staff anyway; it gives up Next's maturity and ecosystem for
  little real gain here.
- **Astro / Vite-SSG for the Guest app** — rejected: an authenticated booking
  funnel with live availability and payment is app-like, not the content-static
  workload those tools win at.
- **SSR app owning its own server logic / collapsing Hono** — rejected: splits
  business logic across two runtimes and couples the internal API's uptime to
  the public app.
- **Two separate auth pools for Guest vs Staff** — rejected as overkill for the
  scale; `role`-gating provides sufficient separation.

## Out of scope

Google sign-in and the Staff invitation mechanism are intentionally not decided
here. Guest-app SSR data-fetching mechanics are deferred (leaning toward a
shared, typed Hono RPC client).
