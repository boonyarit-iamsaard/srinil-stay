import type { Currency } from "@srinil-stay/domain/money";
import {
  createMoney,
  formatMoney as formatMoneyValue,
  moneyFromMajorUnit,
  moneyToMajorUnit,
} from "@srinil-stay/domain/money";
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
import {
  Pencil,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

interface Unit {
  active: boolean;
  basePriceMinor: number;
  currency: Currency;
  guestCapacity: number;
  id: string;
  name: string;
  shortDescription: string;
}

interface UnitFormValues {
  basePrice: number;
  currency: Currency;
  guestCapacity: number;
  name: string;
  shortDescription: string;
}

const EMPTY_UNIT_FORM_VALUES: UnitFormValues = {
  name: "",
  shortDescription: "",
  guestCapacity: 2,
  basePrice: 1,
  currency: "THB",
};

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
  return formatMoneyValue(
    createMoney({
      amountMinor: unit.basePriceMinor,
      currency: unit.currency,
    })
  );
}

async function parseErrorResponse(response: Response) {
  const parsed = errorResponseSchema.safeParse(
    await response.json().catch(() => null)
  );
  return parsed.success ? parsed.data.error : undefined;
}

function unitToFormValues(unit: Unit): UnitFormValues {
  return {
    name: unit.name,
    shortDescription: unit.shortDescription,
    guestCapacity: unit.guestCapacity,
    basePrice: moneyToMajorUnit(
      createMoney({
        amountMinor: unit.basePriceMinor,
        currency: unit.currency,
      })
    ),
    currency: unit.currency,
  };
}

function getSubmitLabel(isSubmitting: boolean, isEditing: boolean) {
  if (isSubmitting) {
    return isEditing ? "Saving..." : "Creating...";
  }

  return isEditing ? "Save Unit" : "Create Unit";
}

function getUnitRowClassName(unit: Unit) {
  return unit.active
    ? "border-b last:border-0"
    : "border-b bg-muted/20 text-muted-foreground last:border-0";
}

function getActiveStateActionLabel(unit: Unit) {
  return unit.active ? "Deactivate" : "Reactivate";
}

export function UnitManagement() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [updatingActiveUnitId, setUpdatingActiveUnitId] = useState<
    string | null
  >(null);

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
    defaultValues: EMPTY_UNIT_FORM_VALUES,
    onSubmit: async ({ value, formApi }) => {
      const { basePrice, ...rest } = value;
      const response = await fetch(
        `${env.VITE_SERVER_URL}/units${editingUnit ? `/${editingUnit.id}` : ""}`,
        {
          method: editingUnit ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...rest,
            basePriceMinor: moneyFromMajorUnit({
              amount: basePrice,
              currency: rest.currency,
            }).amountMinor,
          }),
        }
      );

      if (!response.ok) {
        toast.error(
          (await parseErrorResponse(response)) ??
            `Could not ${editingUnit ? "update" : "create"} unit`
        );
        return;
      }

      toast.success(`${value.name} ${editingUnit ? "updated" : "created"}`);
      setEditingUnit(null);
      formApi.reset(EMPTY_UNIT_FORM_VALUES);
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

  const startEditing = (unit: Unit) => {
    setEditingUnit(unit);
    form.reset(unitToFormValues(unit));
  };

  const cancelEditing = () => {
    setEditingUnit(null);
    form.reset(EMPTY_UNIT_FORM_VALUES);
  };

  const updateActiveState = async (unit: Unit) => {
    setUpdatingActiveUnitId(unit.id);
    const nextActiveState = !unit.active;
    const response = await fetch(
      `${env.VITE_SERVER_URL}/units/${unit.id}/active`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActiveState }),
      }
    );

    setUpdatingActiveUnitId(null);
    if (!response.ok) {
      toast.error(
        (await parseErrorResponse(response)) ??
          `Could not ${unit.active ? "deactivate" : "reactivate"} unit`
      );
      return;
    }

    toast.success(
      `${unit.name} ${nextActiveState ? "reactivated" : "deactivated"}`
    );
    await loadUnits();
  };

  return (
    <div className="grid min-h-0 gap-4 p-4 lg:grid-cols-[minmax(20rem,24rem)_1fr]">
      <Card className="self-start">
        <CardHeader>
          <CardTitle>{editingUnit ? "Edit Unit" : "Create Unit"}</CardTitle>
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

            <div className="flex flex-wrap gap-2">
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button disabled={!canSubmit || isSubmitting} type="submit">
                    {editingUnit ? <Save /> : <Plus />}
                    {getSubmitLabel(isSubmitting, editingUnit !== null)}
                  </Button>
                )}
              </form.Subscribe>
              {editingUnit && (
                <Button onClick={cancelEditing} type="button" variant="outline">
                  <X />
                  Cancel
                </Button>
              )}
            </div>
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
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr className={getUnitRowClassName(unit)} key={unit.id}>
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
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`Edit ${unit.name}`}
                        onClick={() => startEditing(unit)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label={`${getActiveStateActionLabel(unit)} ${unit.name}`}
                        disabled={updatingActiveUnitId === unit.id}
                        onClick={() => updateActiveState(unit)}
                        size="sm"
                        type="button"
                        variant={unit.active ? "destructive" : "outline"}
                      >
                        {unit.active ? <Power /> : <RotateCcw />}
                        {getActiveStateActionLabel(unit)}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground text-sm"
                    colSpan={5}
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
