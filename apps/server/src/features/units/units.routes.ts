import { unitCurrencySchema } from "@srinil-stay/drizzle/schema/units";
import { Hono } from "hono";
import { z } from "zod";

import { requireStaff } from "../../lib/require-staff";
import { createUnit, listUnits } from "./units.service";

const createSchema = z.object({
  name: z.string().min(1),
  shortDescription: z.string().min(1),
  guestCapacity: z.int().positive(),
  basePriceMinor: z.int().positive(),
  currency: unitCurrencySchema,
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
  const parsed = createSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const unit = await createUnit(parsed.data);

  return c.json(unit, 201);
});

unitsRoutes.get("/", async (c) => c.json({ units: await listUnits() }));
