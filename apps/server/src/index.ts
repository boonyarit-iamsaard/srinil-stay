import { serve } from "@hono/node-server";
import { auth } from "@srinil-stay/auth";
import { env } from "@srinil-stay/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/", (c) => c.text("OK"));

serve(
  {
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: 4000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
