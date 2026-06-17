import type { Currency } from "@srinil-stay/domain/money";
import { db } from "@srinil-stay/drizzle";
import { units } from "@srinil-stay/drizzle/schema/units";
import { asc, eq } from "drizzle-orm";

export interface CreateUnitInput {
  basePriceMinor: number;
  currency: Currency;
  guestCapacity: number;
  name: string;
  shortDescription: string;
}

export type UpdateUnitInput = CreateUnitInput;

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

export async function updateUnit(id: string, input: UpdateUnitInput) {
  const [unit] = await db
    .update(units)
    .set({
      name: input.name,
      shortDescription: input.shortDescription,
      guestCapacity: input.guestCapacity,
      basePriceMinor: input.basePriceMinor,
      currency: input.currency,
    })
    .where(eq(units.id, id))
    .returning();

  return unit;
}

export async function updateUnitActiveState(id: string, active: boolean) {
  const [unit] = await db
    .update(units)
    .set({ active })
    .where(eq(units.id, id))
    .returning();

  return unit;
}
