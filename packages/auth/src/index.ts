import type { Role } from "@srinil-stay/domain/role";
import { DEFAULT_ROLE, STAFF_ROLE } from "@srinil-stay/domain/role";
import { createDb } from "@srinil-stay/drizzle";
import {
  accounts,
  accountsRelations,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
  verifications,
} from "@srinil-stay/drizzle/schema/auth";
import { env } from "@srinil-stay/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Role as BetterAuthRole } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

const schema = {
  accounts,
  accountsRelations,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
  verifications,
};

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema,
    }),
    trustedOrigins: env.CORS_ORIGIN,
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      database: {
        generateId: false,
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [
      admin({
        defaultRole: DEFAULT_ROLE,
        adminRoles: [STAFF_ROLE],
        roles: {
          guest: userAc,
          staff: adminAc,
        } satisfies Record<Role, BetterAuthRole>,
      }),
    ],
  });
}

export const auth = createAuth();
