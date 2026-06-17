import { auth } from "@srinil-stay/auth";
import { DEFAULT_ROLE, STAFF_ROLE } from "@srinil-stay/drizzle/schema/roles";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { unitsRoutes } from "./units.routes";

beforeEach(() => {
  vi.clearAllMocks();
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
    role: STAFF_ROLE,
    banned: false,
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

const GUEST_SESSION: NonNullable<SessionResult> = {
  user: {
    ...AUTHENTICATED_SESSION.user,
    id: "guest-user-id",
    email: "guest@example.com",
    name: "Guest User",
    role: DEFAULT_ROLE,
  },
  session: {
    ...AUTHENTICATED_SESSION.session,
    id: "guest-session-id",
    userId: "guest-user-id",
    token: "guest-session-token",
  },
};

function stubSession(value: SessionResult) {
  vi.spyOn(auth.api, "getSession").mockResolvedValue(value);
}

function postJson(path: string, body: unknown) {
  return unitsRoutes.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function get(path: string) {
  return unitsRoutes.request(path);
}

describe("POST /units", () => {
  it("creates an active Unit for an authenticated Staff caller", async () => {
    stubSession(AUTHENTICATED_SESSION);

    const res = await postJson("/", {
      name: "Garden Bungalow",
      shortDescription: "Quiet standalone unit near the garden.",
      guestCapacity: 2,
      basePriceMinor: 180_000,
      currency: "THB",
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      name: "Garden Bungalow",
      shortDescription: "Quiet standalone unit near the garden.",
      guestCapacity: 2,
      basePriceMinor: 180_000,
      currency: "THB",
      active: true,
    });
  });

  it("rejects non-THB or non-integer money values", async () => {
    stubSession(AUTHENTICATED_SESSION);

    expect(
      (
        await postJson("/", {
          name: "Garden Bungalow",
          shortDescription: "Quiet standalone unit near the garden.",
          guestCapacity: 2,
          basePriceMinor: 180_000,
          currency: "USD",
        })
      ).status
    ).toBe(400);
    expect(
      (
        await postJson("/", {
          name: "Garden Bungalow",
          shortDescription: "Quiet standalone unit near the garden.",
          guestCapacity: 2,
          basePriceMinor: 1800.5,
          currency: "THB",
        })
      ).status
    ).toBe(400);
  });

  it("rejects a zero base price", async () => {
    stubSession(AUTHENTICATED_SESSION);

    const res = await postJson("/", {
      name: "Garden Bungalow",
      shortDescription: "Quiet standalone unit near the garden.",
      guestCapacity: 2,
      basePriceMinor: 0,
      currency: "THB",
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /units", () => {
  it("lists Units created by Staff", async () => {
    stubSession(AUTHENTICATED_SESSION);
    await postJson("/", {
      name: "Garden Bungalow",
      shortDescription: "Quiet standalone unit near the garden.",
      guestCapacity: 2,
      basePriceMinor: 180_000,
      currency: "THB",
    });
    await postJson("/", {
      name: "Family Unit",
      shortDescription: "Two-bed unit for families.",
      guestCapacity: 4,
      basePriceMinor: 260_000,
      currency: "THB",
    });

    const res = await get("/");

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      units: [
        {
          name: "Garden Bungalow",
          shortDescription: "Quiet standalone unit near the garden.",
          guestCapacity: 2,
          basePriceMinor: 180_000,
          currency: "THB",
          active: true,
        },
        {
          name: "Family Unit",
          shortDescription: "Two-bed unit for families.",
          guestCapacity: 4,
          basePriceMinor: 260_000,
          currency: "THB",
          active: true,
        },
      ],
    });
  });
});

describe("Unit API access", () => {
  it("rejects callers who are not authenticated Staff", async () => {
    stubSession(null);
    expect((await postJson("/", {})).status).toBe(401);
    expect((await get("/")).status).toBe(401);

    stubSession(GUEST_SESSION);
    expect((await postJson("/", {})).status).toBe(403);
    expect((await get("/")).status).toBe(403);
  });
});
