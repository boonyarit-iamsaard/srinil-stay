import { auth } from "@srinil-stay/auth";
import { Hono } from "hono";
import { z } from "zod";

import {
  acceptInvitation,
  createInvitation,
  resolveInvitation,
} from "./invitations.service";

const createSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
});

const acceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

async function parseJsonBody(request: { json: () => Promise<unknown> }) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const invitationsRoutes = new Hono();

// Create / resend an invitation. Requires an authenticated Staff session;
// *which* staff may invite (role gating) is out of scope for now.
invitationsRoutes.post("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const parsed = createSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const result = await createInvitation(parsed.data);
  if (!result.ok) {
    return c.json({ error: "A user with this email already exists" }, 409);
  }

  return c.json({ ok: true }, 201);
});

// Resolve a token so the accept page can show the invitee and fail fast on
// dead links.
invitationsRoutes.get("/:token", async (c) => {
  const result = await resolveInvitation(c.req.param("token"));
  if (!result.ok) {
    return c.json(
      { error: result.code },
      result.code === "NOT_FOUND" ? 404 : 410
    );
  }
  return c.json({ name: result.name, email: result.email });
});

// Accept an invitation: create the Staff user. Idempotent on retry.
invitationsRoutes.post("/accept", async (c) => {
  const parsed = acceptSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const result = await acceptInvitation(parsed.data);
  if (!result.ok) {
    if (result.code === "ACCEPTED") {
      return c.json({ error: "ALREADY_ACCEPTED" }, 409);
    }
    return c.json(
      { error: result.code },
      result.code === "NOT_FOUND" ? 404 : 410
    );
  }

  return c.json({ ok: true });
});
