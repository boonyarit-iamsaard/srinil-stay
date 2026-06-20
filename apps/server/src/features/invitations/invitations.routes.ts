import {
  INVITATION_STATUS,
  type InvitationStatus,
} from "@srinil-stay/domain/invitation";
import { Hono } from "hono";
import { z } from "zod";

import { requireStaff } from "../../lib/require-staff";
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

const INVITATION_STATUS_MESSAGES = {
  [INVITATION_STATUS.ACCEPTED]: "Invitation has already been accepted",
  [INVITATION_STATUS.EXPIRED]: "Invitation has expired",
  [INVITATION_STATUS.EXISTING_USER]: "A user with this email already exists",
  [INVITATION_STATUS.MISSING]: "Invitation was not found",
  [INVITATION_STATUS.PENDING]: "Invitation is pending",
} as const satisfies Record<InvitationStatus, string>;

function invitationStatusMessage(status: InvitationStatus): string {
  return INVITATION_STATUS_MESSAGES[status];
}

function resolveHttpStatus(status: InvitationStatus) {
  return status === INVITATION_STATUS.MISSING ? 404 : 410;
}

function acceptHttpStatus(status: InvitationStatus) {
  if (status === INVITATION_STATUS.MISSING) {
    return 404;
  }

  if (
    status === INVITATION_STATUS.ACCEPTED ||
    status === INVITATION_STATUS.EXISTING_USER
  ) {
    return 409;
  }

  return 410;
}

export const invitationsRoutes = new Hono();

// Create / resend an invitation. Requires an authenticated Staff session.
invitationsRoutes.post("/", requireStaff, async (c) => {
  const parsed = createSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const result = await createInvitation(parsed.data);
  if (!result.ok) {
    return c.json(
      {
        status: result.status,
        error: invitationStatusMessage(result.status),
      },
      409
    );
  }

  return c.json({ ok: true, status: result.status }, 201);
});

// Resolve a token so the accept page can show the invitee and fail fast on
// dead links.
invitationsRoutes.get("/:token", async (c) => {
  const result = await resolveInvitation(c.req.param("token"));
  if (!result.ok) {
    return c.json(
      {
        status: result.status,
        error: invitationStatusMessage(result.status),
      },
      resolveHttpStatus(result.status)
    );
  }
  return c.json({
    status: result.status,
    name: result.name,
    email: result.email,
  });
});

// Accept an invitation: create the Staff user. Idempotent on retry.
invitationsRoutes.post("/accept", async (c) => {
  const parsed = acceptSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const result = await acceptInvitation(parsed.data);
  if (!result.ok) {
    return c.json(
      {
        status: result.status,
        error: invitationStatusMessage(result.status),
      },
      acceptHttpStatus(result.status)
    );
  }

  return c.json({ ok: true, status: result.status });
});
