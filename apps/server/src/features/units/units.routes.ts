import {
  createPositiveMoney,
  SUPPORTED_CURRENCIES,
} from "@srinil-stay/domain/money";
import { Hono } from "hono";
import { z } from "zod";

import { requireStaff } from "../../lib/require-staff";
import {
  createUnit,
  listUnits,
  updateUnit,
  updateUnitActiveState,
} from "./units.service";

const unitDetailsSchema = z
  .object({
    name: z.string().min(1),
    shortDescription: z.string().min(1),
    guestCapacity: z.int().positive(),
    basePriceMinor: z.number(),
    currency: z.enum(SUPPORTED_CURRENCIES),
  })
  .superRefine((input, context) => {
    try {
      createPositiveMoney({
        amountMinor: input.basePriceMinor,
        currency: input.currency,
      });
    } catch {
      context.addIssue({
        code: "custom",
        path: ["basePriceMinor"],
        message: "Invalid money",
      });
    }
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

  const unit = await createUnit(parsed.data);

  return c.json(unit, 201);
});

unitsRoutes.get("/", async (c) => c.json({ units: await listUnits() }));

unitsRoutes.patch("/:id", async (c) => {
  const parsed = unitDetailsSchema.safeParse(await parseJsonBody(c.req));
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const unit = await updateUnit(c.req.param("id"), parsed.data);
  if (!unit) {
    return c.json({ error: "Unit not found" }, 404);
  }

  return c.json(unit);
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

  return c.json(unit);
});
