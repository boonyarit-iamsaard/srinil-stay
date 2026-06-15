# Srinil Stay — Context

A management and booking system for **Srinil Stay**, a single small homestay in
Phatthalung, Thailand, with roughly ten bookable units. This is _not_ a
multi-property platform — there is one homestay, one location, a handful of
staff.

## Glossary

### Homestay

The business itself — Srinil Stay. Singular. There is exactly one. Do not model
this as a tenant or as a collection of "properties"; the system serves this one
homestay only.

### Unit

A single bookable space within the homestay (a room, or a small house). There
are ~10 of them. The thing a Guest reserves for a set of dates.

> Term still being sharpened: whether the bookable thing is consistently called
> a "Unit", "Room", or "House" is open — see open questions.

### Guest

A customer who discovers the homestay (typically via Google/social), browses
unit availability, and books a stay. The audience of the **customer-facing
web app**. Guests may self-register or sign in through Guest-facing
authentication flows.

### Staff

An internal operator who manages units, availability, and bookings. The audience
of the **admin app**. Few in number. Only Staff may use Staff-only operations;
being an authenticated Guest is not enough. Staff are invited, never
self-registered.

### Booking

A Guest's reservation of a Unit for a date range, including payment. Owned
server-side by the Hono API.

### Invitation

A single-use, token-bearing email offer that lets a new person become Staff,
consumed once when the recipient accepts and sets their own password. An
Invitation is issued either by an existing Staff member (in the admin app), or
— for a Staff member the system is configured to provision — by the system
itself on startup. The latter, the **bootstrap** path, is how the first Staff
comes into being before any Staff exists to invite them.

_Avoid_: invite (as a noun), signup — Staff are invited, never self-registered.
