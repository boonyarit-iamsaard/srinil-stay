import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// A single-use, token-bearing offer to become Staff. State is implied by
// timestamps rather than a status enum:
//   pending  = acceptedAt IS NULL AND now < expiresAt
//   accepted = acceptedAt IS NOT NULL
//   expired  = acceptedAt IS NULL AND now >= expiresAt
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").default(sql`uuidv7()`).primaryKey(),
    // Natural idempotency key: one invitation per email (upsert on conflict).
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    // Rotates on every resend, so only the most recent link is ever valid.
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("invitations_token_idx").on(table.token)]
);
