import { describe, expect, it } from "vitest";

import { DEFAULT_ROLE, GUEST_ROLE, isStaff, ROLES, STAFF_ROLE } from "./role";

describe("Role", () => {
  it("enumerates exactly the Guest and Staff roles", () => {
    expect([...ROLES]).toEqual([GUEST_ROLE, STAFF_ROLE]);
  });

  it("recognises Staff as the privileged role and rejects Guests", () => {
    expect(isStaff(STAFF_ROLE)).toBe(true);
    expect(isStaff(GUEST_ROLE)).toBe(false);
  });

  it("defaults new accounts to the Guest role", () => {
    expect(DEFAULT_ROLE).toBe(GUEST_ROLE);
    expect(isStaff(DEFAULT_ROLE)).toBe(false);
  });

  it("rejects unknown and missing role values", () => {
    expect(isStaff("admin")).toBe(false);
    expect(isStaff("")).toBe(false);
    expect(isStaff(undefined)).toBe(false);
    expect(isStaff(null)).toBe(false);
  });
});
