import { DEFAULT_ROLE, STAFF_ROLE } from "@srinil-stay/domain/role";
import { db } from "@srinil-stay/drizzle";
import { users } from "@srinil-stay/drizzle/schema/auth";
import { invitations } from "@srinil-stay/drizzle/schema/invitations";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendMail } from "../../lib/mailer";
import {
  acceptInvitation,
  createInvitation,
  resolveInvitation,
} from "./invitations.service";

vi.mock("../../lib/mailer", () => ({ sendMail: vi.fn() }));

const PASSWORD = "password123";

beforeEach(() => {
  vi.clearAllMocks();
});

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

describe("createInvitation", () => {
  it("persists a pending invitation and sends an email", async () => {
    const result = await createInvitation({
      email: "new@example.com",
      name: "New Staff",
    });

    expect(result.ok).toBe(true);
    const row = await tokenFor("new@example.com");
    expect(row).toMatchObject({ name: "New Staff", acceptedAt: null });
    expect(row.token).toBeTruthy();
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(sendMail).toHaveBeenCalledOnce();
  });

  it("is idempotent on email: a resend rotates the token in place", async () => {
    await createInvitation({ email: "dup@example.com", name: "First" });
    const first = await tokenFor("dup@example.com");

    await createInvitation({ email: "dup@example.com", name: "Second" });
    const second = await tokenFor("dup@example.com");

    const all = await db
      .select()
      .from(invitations)
      .where(eq(invitations.email, "dup@example.com"));
    expect(all).toHaveLength(1);
    expect(second.token).not.toBe(first.token);
    expect(second.name).toBe("Second");
    expect(second.acceptedAt).toBeNull();
  });

  it("rejects an email that already belongs to a user", async () => {
    await db
      .insert(users)
      .values({ name: "Existing", email: "taken@example.com" });

    const result = await createInvitation({
      email: "taken@example.com",
      name: "Taken",
    });

    expect(result).toEqual({ ok: false, code: "USER_EXISTS" });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("normalizes the email to lower case", async () => {
    await createInvitation({ email: "MixedCase@Example.com", name: "Mixed" });
    const row = await tokenFor("mixedcase@example.com");
    expect(row).toBeDefined();
  });
});

describe("resolveInvitation", () => {
  it("returns name and email for a pending token", async () => {
    await createInvitation({ email: "pending@example.com", name: "Pending" });
    const { token } = await tokenFor("pending@example.com");

    const result = await resolveInvitation(token);

    expect(result).toEqual({
      ok: true,
      name: "Pending",
      email: "pending@example.com",
    });
  });

  it("reports NOT_FOUND for an unknown token", async () => {
    expect(await resolveInvitation("nope")).toEqual({
      ok: false,
      code: "NOT_FOUND",
    });
  });

  it("reports EXPIRED for a past token", async () => {
    await db.insert(invitations).values({
      email: "old@example.com",
      name: "Old",
      token: "expired-token",
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(await resolveInvitation("expired-token")).toEqual({
      ok: false,
      code: "EXPIRED",
    });
  });

  it("reports ACCEPTED once consumed", async () => {
    await createInvitation({ email: "done@example.com", name: "Done" });
    const { token } = await tokenFor("done@example.com");
    await acceptInvitation({ token, password: PASSWORD });

    expect(await resolveInvitation(token)).toEqual({
      ok: false,
      code: "ACCEPTED",
    });
  });
});

describe("acceptInvitation", () => {
  it("creates the user and consumes the invitation", async () => {
    await createInvitation({ email: "accept@example.com", name: "Acceptee" });
    const { token } = await tokenFor("accept@example.com");

    const result = await acceptInvitation({ token, password: PASSWORD });

    expect(result).toEqual({ ok: true });
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, "accept@example.com"));
    expect(userRows).toHaveLength(1);
    expect(userRows[0]?.role).toBe(STAFF_ROLE);
    const row = await tokenFor("accept@example.com");
    expect(row.acceptedAt).not.toBeNull();
  });

  it("is concurrency-safe: two parallel accepts create exactly one user", async () => {
    await createInvitation({ email: "race@example.com", name: "Racer" });
    const { token } = await tokenFor("race@example.com");

    const results = await Promise.all([
      acceptInvitation({ token, password: PASSWORD }),
      acceptInvitation({ token, password: PASSWORD }),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toEqual({
      ok: false,
      code: "ACCEPTED",
    });
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, "race@example.com"));
    expect(userRows).toHaveLength(1);
    expect(userRows[0]?.role).toBe(STAFF_ROLE);
  });

  it("defaults direct user inserts to the guest role", async () => {
    await db
      .insert(users)
      .values({ name: "Guest", email: "guest@example.com" });

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, "guest@example.com"));

    expect(userRows).toHaveLength(1);
    expect(userRows[0]?.role).toBe(DEFAULT_ROLE);
  });

  it("rejects an expired token without creating a user", async () => {
    await db.insert(invitations).values({
      email: "late@example.com",
      name: "Late",
      token: "late-token",
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(
      await acceptInvitation({ token: "late-token", password: PASSWORD })
    ).toEqual({ ok: false, code: "EXPIRED" });
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, "late@example.com"));
    expect(userRows).toHaveLength(0);
  });

  it("releases the claim when user creation fails (compensation)", async () => {
    // Seed an invitation whose email already belongs to a user, so the
    // createUser call hits the existing users.email unique constraint and throws.
    await db
      .insert(users)
      .values({ name: "Clash", email: "clash@example.com" });
    await db.insert(invitations).values({
      email: "clash@example.com",
      name: "Clash",
      token: "clash-token",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      acceptInvitation({ token: "clash-token", password: PASSWORD })
    ).rejects.toThrow();

    const row = await tokenFor("clash@example.com");
    expect(row.acceptedAt).toBeNull();
  });
});
