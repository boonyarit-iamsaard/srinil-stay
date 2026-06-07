import { env } from "@srinil-stay/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import {
  accounts,
  accountsRelations,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
  verifications,
} from "./schema/auth";
import { invitations } from "./schema/invitations";

const schema = {
  accounts,
  accountsRelations,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
  verifications,
  invitations,
};

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();
