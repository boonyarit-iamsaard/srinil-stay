import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const UNIT_CURRENCIES = ["THB"] as const;

export type UnitCurrency = (typeof UNIT_CURRENCIES)[number];

export const unitCurrencySchema = z.enum(UNIT_CURRENCIES);

export const units = pgTable("units", {
  id: uuid("id").default(sql`uuidv7()`).primaryKey(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  guestCapacity: integer("guest_capacity").notNull(),
  basePriceMinor: integer("base_price_minor").notNull(),
  currency: text("currency").$type<UnitCurrency>().notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
