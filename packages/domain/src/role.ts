export const ROLES = ["guest", "staff"] as const;

export type Role = (typeof ROLES)[number];

export const GUEST_ROLE: Role = "guest";
export const STAFF_ROLE: Role = "staff";

export const DEFAULT_ROLE: Role = GUEST_ROLE;

export function isStaff(role: string | null | undefined): boolean {
  return role === STAFF_ROLE;
}
