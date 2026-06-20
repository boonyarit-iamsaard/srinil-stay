import { describe, expect, it } from "vitest";
import { INVITATION_STATUS, invitationLifecycleStatus } from "./invitation";

describe("invitationLifecycleStatus", () => {
  const now = new Date("2026-06-20T00:00:00.000Z");

  it("reports missing when no invitation row exists", () => {
    expect(invitationLifecycleStatus(null, now)).toBe(
      INVITATION_STATUS.MISSING
    );
  });

  it("reports accepted before expiry checks", () => {
    expect(
      invitationLifecycleStatus(
        {
          acceptedAt: new Date("2026-06-19T00:00:00.000Z"),
          expiresAt: new Date("2026-06-19T12:00:00.000Z"),
        },
        now
      )
    ).toBe(INVITATION_STATUS.ACCEPTED);
  });

  it("reports expired when the expiry has passed", () => {
    expect(
      invitationLifecycleStatus(
        {
          acceptedAt: null,
          expiresAt: new Date("2026-06-19T12:00:00.000Z"),
        },
        now
      )
    ).toBe(INVITATION_STATUS.EXPIRED);
  });

  it("reports pending for an unaccepted future invitation", () => {
    expect(
      invitationLifecycleStatus(
        {
          acceptedAt: null,
          expiresAt: new Date("2026-06-20T12:00:00.000Z"),
        },
        now
      )
    ).toBe(INVITATION_STATUS.PENDING);
  });
});
