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

A single bookable space within the homestay, such as a room or small house.
There are ~10 of them. A Unit is defined by the reservation boundary: if spaces
are only ever booked together, they are one Unit; if one physical structure can
be booked separately, each reservable part is its own Unit. A Unit has
attributes that describe it, including guest capacity and base price, but it
does not belong to a parent Property. Units are removed from sale by
deactivation, not hard deletion.

_Avoid_: Room, House, Property — use these only as descriptive labels or
attributes, not as the canonical bookable thing.

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

### Invitation expiry

The window in which an Invitation's link stays valid before it lapses to the
`expired` status — currently 12 hours from issue. It is a single policy: the
duration and its human label ("12 hours") are owned together so the value used
to compute `expiresAt` and the prose shown to people cannot drift apart.
