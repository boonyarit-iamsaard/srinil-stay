import { db } from "@srinil-stay/drizzle";
import { type UnitCurrency, units } from "@srinil-stay/drizzle/schema/units";
import { asc } from "drizzle-orm";

export interface CreateUnitInput {
  basePriceMinor: number;
  currency: UnitCurrency;
  guestCapacity: number;
  name: string;
  shortDescription: string;
}

export async function createUnit(input: CreateUnitInput) {
  const [unit] = await db
    .insert(units)
    .values({
      name: input.name,
      shortDescription: input.shortDescription,
      guestCapacity: input.guestCapacity,
      basePriceMinor: input.basePriceMinor,
      currency: input.currency,
    })
    .returning();

  if (!unit) {
    throw new Error("Failed to persist unit");
  }

  return unit;
}

export function listUnits() {
  return db.select().from(units).orderBy(asc(units.createdAt), asc(units.id));
}
