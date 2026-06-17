import { env } from "@srinil-stay/env/back-office";
import { Button } from "@srinil-stay/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@srinil-stay/ui/components/card";
import { Input } from "@srinil-stay/ui/components/input";
import { Label } from "@srinil-stay/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

interface Unit {
  active: boolean;
  basePriceMinor: number;
  currency: "THB";
  guestCapacity: number;
  id: string;
  name: string;
  shortDescription: string;
}

const unitSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  guestCapacity: z.number(),
  basePriceMinor: z.number(),
  currency: z.literal("THB"),
  active: z.boolean(),
});

const unitsResponseSchema = z.object({
  units: z.array(unitSchema),
});

const errorResponseSchema = z.object({
  error: z.string().optional(),
});

function formatMoney(unit: Unit) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: unit.currency,
  }).format(unit.basePriceMinor / 100);
}

async function parseErrorResponse(response: Response) {
  const parsed = errorResponseSchema.safeParse(
    await response.json().catch(() => null)
  );
  return parsed.success ? parsed.data.error : undefined;
}

export function UnitManagement() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);

  const loadUnits = useCallback(async () => {
    setIsLoadingUnits(true);
    const response = await fetch(`${env.VITE_SERVER_URL}/units`, {
      credentials: "include",
    });

    if (!response.ok) {
      toast.error(
        (await parseErrorResponse(response)) ?? "Could not load units"
      );
      setIsLoadingUnits(false);
      return;
    }

    const parsed = unitsResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      toast.error("Could not load units");
      setIsLoadingUnits(false);
      return;
    }

    setUnits(parsed.data.units);
    setIsLoadingUnits(false);
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const form = useForm({
    defaultValues: {
      name: "",
      shortDescription: "",
      guestCapacity: 2,
      basePrice: 1,
      currency: "THB" as const,
    },
    onSubmit: async ({ value, formApi }) => {
      const { basePrice, ...rest } = value;
      const response = await fetch(`${env.VITE_SERVER_URL}/units`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          basePriceMinor: basePrice * 100,
        }),
      });

      if (!response.ok) {
        toast.error(
          (await parseErrorResponse(response)) ?? "Could not create unit"
        );
        return;
      }

      toast.success(`${value.name} created`);
      formApi.reset();
      await loadUnits();
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        shortDescription: z.string().min(1, "Short description is required"),
        guestCapacity: z.int().positive("Guest capacity must be at least 1"),
        basePrice: z.int().positive("Base price must be at least 1 THB"),
        currency: z.literal("THB"),
      }),
    },
  });

  return (
    <div className="grid min-h-0 gap-4 p-4 lg:grid-cols-[minmax(20rem,24rem)_1fr]">
      <Card className="self-start">
        <CardHeader>
          <CardTitle>Create Unit</CardTitle>
          <CardDescription>Core bookable Unit attributes</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="shortDescription">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Short description</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="guestCapacity">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Guests</Label>
                    <Input
                      id={field.name}
                      min={1}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.valueAsNumber)
                      }
                      type="number"
                      value={field.state.value}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p
                        className="text-destructive text-sm"
                        key={error?.message}
                      >
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="basePrice">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Base price</Label>
                    <Input
                      id={field.name}
                      min={1}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.valueAsNumber)
                      }
                      step={1}
                      type="number"
                      value={field.state.value}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p
                        className="text-destructive text-sm"
                        key={error?.message}
                      >
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="currency">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Currency</Label>
                  <Input
                    disabled
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button disabled={!canSubmit || isSubmitting} type="submit">
                  <Plus />
                  {isSubmitting ? "Creating..." : "Create Unit"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>

      <section className="min-h-0 overflow-hidden rounded-lg border bg-card">
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <div>
            <h2 className="font-medium text-sm">Units</h2>
            <p className="text-muted-foreground text-xs">
              {units.length} total
            </p>
          </div>
          <Button
            aria-label="Refresh units"
            className="ml-auto"
            disabled={isLoadingUnits}
            onClick={loadUnits}
            size="icon"
            type="button"
            variant="outline"
          >
            <RefreshCw
              className={isLoadingUnits ? "animate-spin" : undefined}
            />
          </Button>
        </div>
        <div className="min-h-0 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Guests</th>
                <th className="px-4 py-3 font-medium">Base price</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr className="border-b last:border-0" key={unit.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{unit.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {unit.shortDescription}
                    </div>
                  </td>
                  <td className="px-4 py-3">{unit.guestCapacity}</td>
                  <td className="px-4 py-3">{formatMoney(unit)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        unit.active
                          ? "rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 text-xs dark:text-emerald-300"
                          : "rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs"
                      }
                    >
                      {unit.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground text-sm"
                    colSpan={4}
                  >
                    {isLoadingUnits ? "Loading units..." : "No units"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
