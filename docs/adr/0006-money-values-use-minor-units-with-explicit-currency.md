# Money values use minor units with explicit currency

Status: accepted

Srinil Stay stores money values as integer minor units with an explicit ISO 4217
currency code. The system initially supports only Thai baht (`THB`), but the
currency remains part of each money-shaped record so later payment integration
and possible currency expansion do not rely on hidden assumptions. Floating
point money values are avoided to prevent rounding errors in Unit pricing,
Bookings, and payment-provider requests.
