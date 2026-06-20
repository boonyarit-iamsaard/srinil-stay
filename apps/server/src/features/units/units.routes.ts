import {
  UnitValidationError,
  unitViewFromPersistence,
} from "@srinil-stay/domain/unit";
import { Hono } from "hono";
import { z } from "zod";

import { requireStaff } from "../../lib/require-staff";
import {
  createUnit,
  listUnits,
  updateUnit,
  updateUnitActiveState,
} from "./units.service";

const unitDetailsSchema = z.object({
  name: z.string(),
  shortDescription: z.string(),
  guestCapacity: z.number(),
  basePriceMinor: z.number(),
  currency: z.string(),
});

const activeStateSchema = z.object({
  active: z.boolean(),
});

async function parseJsonBody(request: { json: () => Promise<unknown> }) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const unitsRoutes = new Hono();

unitsRoutes.use("*", requireStaff);

unitsRoutes.post("/", async (c) => {
  const parsed = unitDetailsSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  try {
    const unit = await createUnit(parsed.data);

    return c.json(unitViewFromPersistence(unit), 201);
  } catch (error) {
    if (error instanceof UnitValidationError) {
      return c.json({ error: "Invalid input" }, 400);
    }

    throw error;
  }
});

unitsRoutes.get("/", async (c) =>
  c.json({ units: (await listUnits()).map(unitViewFromPersistence) })
);

unitsRoutes.patch("/:id", async (c) => {
  const parsed = unitDetailsSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  try {
    const unit = await updateUnit(c.req.param("id"), parsed.data);
    if (!unit) {
      return c.json({ error: "Unit not found" }, 404);
    }

    return c.json(unitViewFromPersistence(unit));
  } catch (error) {
    if (error instanceof UnitValidationError) {
      return c.json({ error: "Invalid input" }, 400);
    }

    throw error;
  }
});

unitsRoutes.patch("/:id/active", async (c) => {
  const parsed = activeStateSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const unit = await updateUnitActiveState(
    c.req.param("id"),
    parsed.data.active
  );
  if (!unit) {
    return c.json({ error: "Unit not found" }, 404);
  }

  return c.json(unitViewFromPersistence(unit));
});
