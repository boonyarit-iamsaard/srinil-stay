import type { Currency } from "@srinil-stay/domain/money";
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const units = pgTable("units", {
  id: uuid("id").default(sql`uuidv7()`).primaryKey(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  guestCapacity: integer("guest_capacity").notNull(),
  basePriceMinor: integer("base_price_minor").notNull(),
  currency: text("currency").$type<Currency>().notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
