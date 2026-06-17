import {
  createActiveUnit,
  createUnitDetails,
  setUnitActiveState,
  type UnitDetailsInput,
  unitDetailsToPersistence,
  unitFromPersistence,
} from "@srinil-stay/domain/unit";
import { db } from "@srinil-stay/drizzle";
import { units } from "@srinil-stay/drizzle/schema/units";
import { asc, eq } from "drizzle-orm";

export type CreateUnitInput = UnitDetailsInput;
export type UpdateUnitInput = UnitDetailsInput;

export async function createUnit(input: CreateUnitInput) {
  const unitDetails = createActiveUnit(input);
  const [unit] = await db
    .insert(units)
    .values({
      ...unitDetailsToPersistence(unitDetails),
      active: unitDetails.active,
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
  const unitDetails = createUnitDetails(input);
  const [unit] = await db
    .update(units)
    .set(unitDetailsToPersistence(unitDetails))
    .where(eq(units.id, id))
    .returning();

  return unit;
}

export async function updateUnitActiveState(id: string, active: boolean) {
  const [existingUnit] = await db.select().from(units).where(eq(units.id, id));
  if (!existingUnit) {
    return;
  }

  const nextUnit = setUnitActiveState(
    unitFromPersistence(existingUnit),
    active
  );
  const [unit] = await db
    .update(units)
    .set({ active: nextUnit.active })
    .where(eq(units.id, id))
    .returning();

  return unit;
}
