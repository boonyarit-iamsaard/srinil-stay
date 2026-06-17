import { db } from "@srinil-stay/drizzle";
import { sql } from "drizzle-orm";
import { beforeEach } from "vitest";

// Clean slate between tests. CASCADE and RESTART IDENTITY covers the auth tables
// and the invitations table in one statement.
beforeEach(async () => {
  await db.execute(
    sql`TRUNCATE units, invitations, sessions, accounts, verifications, users RESTART IDENTITY CASCADE`
  );
});
