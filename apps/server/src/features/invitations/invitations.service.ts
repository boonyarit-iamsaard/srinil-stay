import { randomBytes } from "node:crypto";

import { auth } from "@srinil-stay/auth";
import { db } from "@srinil-stay/drizzle";
import { users } from "@srinil-stay/drizzle/schema/auth";
import { invitations } from "@srinil-stay/drizzle/schema/invitations";
import { and, eq, gt, isNull } from "drizzle-orm";

import { sendInvitationEmail } from "./invitations.email";

const EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

type Result<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; code: "USER_EXISTS" | "NOT_FOUND" | "EXPIRED" | "ACCEPTED" };

/**
 * Create (or resend) an invitation. Idempotent on `email`: the unique
 * constraint + upsert collapse repeat/concurrent calls to a single row, and
 * the token rotates so only the newest emailed link is valid.
 */
export async function createInvitation(input: {
  email: string;
  name: string;
}): Promise<Result> {
  const email = input.email.toLowerCase();

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existingUser) {
    return { ok: false, code: "USER_EXISTS" };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  const [invitation] = await db
    .insert(invitations)
    .values({ email, name: input.name, token, expiresAt })
    .onConflictDoUpdate({
      target: invitations.email,
      set: { name: input.name, token, expiresAt, acceptedAt: null },
    })
    .returning();

  if (!invitation) {
    throw new Error("Failed to persist invitation");
  }

  await sendInvitationEmail(invitation);

  return { ok: true };
}

/** Resolve a token for the accept page. */
export async function resolveInvitation(
  token: string
): Promise<Result<{ name: string; email: string }>> {
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  });

  if (!invitation) {
    return { ok: false, code: "NOT_FOUND" };
  }
  if (invitation.acceptedAt) {
    return { ok: false, code: "ACCEPTED" };
  }
  if (invitation.expiresAt <= new Date()) {
    return { ok: false, code: "EXPIRED" };
  }

  return { ok: true, name: invitation.name, email: invitation.email };
}

/**
 * Accept an invitation and create the Staff user. Concurrency-safe via an
 * atomic conditional claim (only one request flips `acceptedAt`); the user
 * is created only by the winner, with a compensating reset on failure. The
 * `users.email` unique constraint is the final backstop against duplicates.
 */
export async function acceptInvitation(input: {
  token: string;
  password: string;
}): Promise<Result> {
  const now = new Date();

  const [claimed] = await db
    .update(invitations)
    .set({ acceptedAt: now })
    .where(
      and(
        eq(invitations.token, input.token),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, now)
      )
    )
    .returning();

  if (!claimed) {
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, input.token),
    });
    if (!invitation) {
      return { ok: false, code: "NOT_FOUND" };
    }
    if (invitation.acceptedAt) {
      return { ok: false, code: "ACCEPTED" };
    }
    return { ok: false, code: "EXPIRED" };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: claimed.email,
        name: claimed.name,
        password: input.password,
      },
    });
  } catch (error) {
    // Release the claim so a transient failure doesn't burn the invitation.
    await db
      .update(invitations)
      .set({ acceptedAt: null })
      .where(eq(invitations.id, claimed.id));
    throw error;
  }

  return { ok: true };
}
