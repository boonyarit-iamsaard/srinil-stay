import { db } from "@srinil-stay/drizzle";
import { users } from "@srinil-stay/drizzle/schema/auth";
import { invitations } from "@srinil-stay/drizzle/schema/invitations";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendMail } from "../../lib/mailer";
import { bootstrapStaff } from "./invitations.bootstrap";

vi.mock("../../lib/mailer", () => ({ sendMail: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function invitationFor(email: string) {
  const [row] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.email, email));
  return row;
}

describe("bootstrapStaff", () => {
  it("issues an invitation and emails the declared first Staff", async () => {
    await bootstrapStaff({ email: "owner@example.com", name: "Owner" });

    const row = await invitationFor("owner@example.com");
    expect(row).toMatchObject({ name: "Owner", acceptedAt: null });
    expect(sendMail).toHaveBeenCalledOnce();
  });

  it("is a no-op when the declared email is already a user", async () => {
    await db
      .insert(users)
      .values({ name: "Owner", email: "owner@example.com" });

    await bootstrapStaff({ email: "owner@example.com", name: "Owner" });

    expect(await invitationFor("owner@example.com")).toBeUndefined();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("does nothing when no first Staff is configured", async () => {
    await bootstrapStaff({ email: undefined, name: undefined });

    const all = await db.select().from(invitations);
    expect(all).toHaveLength(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("does not block boot on failure, but surfaces it via a warning", async () => {
    vi.mocked(sendMail).mockRejectedValueOnce(new Error("smtp down"));
    // Capture (and thereby suppress) the expected best-effort warning, and
    // assert it fires — a silently swallowed failure would be a real bug.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {
      // intentionally no-op
    });

    await expect(
      bootstrapStaff({ email: "owner@example.com", name: "Owner" })
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });
});
