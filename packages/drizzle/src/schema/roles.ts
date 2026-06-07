import { z } from "zod";

export const ROLES = ["guest", "staff"] as const;

export type Role = (typeof ROLES)[number];

export const roleSchema = z.enum(ROLES);

export const DEFAULT_ROLE: Role = "guest";
export const STAFF_ROLE: Role = "staff";
