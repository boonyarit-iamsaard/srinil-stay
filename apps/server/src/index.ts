import { serve } from "@hono/node-server";
import { auth } from "@srinil-stay/auth";
import { env } from "@srinil-stay/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { bootstrapStaff } from "./features/invitations/invitations.bootstrap";
import { invitationsRoutes } from "./features/invitations/invitations.routes";
import { unitsRoutes } from "./features/units/units.routes";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "PATCH", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/invitations", invitationsRoutes);
app.route("/units", unitsRoutes);

app.get("/", (c) => c.text("OK"));

// Provision the declared first Staff member (opt-in, best-effort). Not awaited
// so SMTP latency never blocks boot; bootstrapStaff swallows its own errors, so
// this can never reject. See ADR 0004.
bootstrapStaff({
  email: env.BOOTSTRAP_STAFF_EMAIL,
  name: env.BOOTSTRAP_STAFF_NAME,
});

serve(
  {
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: 5000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
