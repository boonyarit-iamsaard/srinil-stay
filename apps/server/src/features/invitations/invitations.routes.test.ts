import { auth } from "@srinil-stay/auth";
import { db } from "@srinil-stay/drizzle";
import { invitations } from "@srinil-stay/drizzle/schema/invitations";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invitationsRoutes } from "./invitations.routes";
import { createInvitation } from "./invitations.service";

vi.mock("../../lib/mailer", () => ({ sendMail: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;
const AUTHENTICATED_SESSION: NonNullable<SessionResult> = {
  user: {
    id: "staff-user-id",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    email: "staff@example.com",
    emailVerified: true,
    name: "Staff User",
  },
  session: {
    id: "staff-session-id",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    userId: "staff-user-id",
    expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    token: "staff-session-token",
  },
};

function stubSession(value: SessionResult) {
  vi.spyOn(auth.api, "getSession").mockResolvedValue(value);
}

function postJson(path: string, body: unknown) {
  return invitationsRoutes.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function tokenFor(email: string) {
  const [row] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.email, email));
  if (!row) {
    throw new Error(`No invitation found for ${email}`);
  }
  return row;
}

describe("POST /invitations", () => {
  it("returns 401 without a session", async () => {
    stubSession(null);
    const res = await postJson("/", { email: "x@example.com", name: "X Y" });
    expect(res.status).toBe(401);
  });

  it("creates an invitation for an authenticated caller", async () => {
    stubSession(AUTHENTICATED_SESSION);
    const res = await postJson("/", {
      email: "invited@example.com",
      name: "Invited",
    });
    expect(res.status).toBe(201);
    expect(await tokenFor("invited@example.com")).toBeDefined();
  });

  it("returns 409 when the email already belongs to a user", async () => {
    stubSession(AUTHENTICATED_SESSION);
    await postJson("/", { email: "first@example.com", name: "First" });
    const { token } = await tokenFor("first@example.com");
    await acceptInvitationViaRoute(token);

    const res = await postJson("/", {
      email: "first@example.com",
      name: "First",
    });
    expect(res.status).toBe(409);
  });
});

function acceptInvitationViaRoute(token: string) {
  return postJson("/accept", { token, password: "password123" });
}

describe("POST /invitations/accept", () => {
  it("returns 400 on invalid input", async () => {
    const res = await postJson("/accept", { token: "" });
    expect(res.status).toBe(400);
  });

  it("returns 409 ALREADY_ACCEPTED on a second accept", async () => {
    await createInvitation({ email: "twice@example.com", name: "Twice" });
    const { token } = await tokenFor("twice@example.com");

    expect((await acceptInvitationViaRoute(token)).status).toBe(200);

    const res = await acceptInvitationViaRoute(token);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "ALREADY_ACCEPTED" });
  });
});

describe("GET /invitations/:token", () => {
  it("returns 200 with the invitee for a pending token", async () => {
    await createInvitation({ email: "look@example.com", name: "Looker" });
    const { token } = await tokenFor("look@example.com");

    const res = await invitationsRoutes.request(`/${token}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      name: "Looker",
      email: "look@example.com",
    });
  });

  it("returns 404 for an unknown token", async () => {
    const res = await invitationsRoutes.request("/unknown");
    expect(res.status).toBe(404);
  });

  it("returns 410 for an expired token", async () => {
    await db.insert(invitations).values({
      email: "gone@example.com",
      name: "Gone",
      token: "gone-token",
      expiresAt: new Date(Date.now() - 1000),
    });

    const res = await invitationsRoutes.request("/gone-token");
    expect(res.status).toBe(410);
  });
});
