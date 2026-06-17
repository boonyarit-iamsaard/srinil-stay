import { describe, expect, it } from "vitest";

import {
  createActiveUnit,
  setUnitActiveState,
  unitDetailsToPersistence,
  updateUnitDetails,
} from "./unit";

describe("Unit", () => {
  it("creates an active Unit from required details and a Money-backed base price", () => {
    const unit = createActiveUnit({
      name: "Garden Bungalow",
      shortDescription: "Quiet standalone unit near the garden.",
      guestCapacity: 2,
      basePriceMinor: 180_000,
      currency: "THB",
    });

    expect(unit).toEqual({
      name: "Garden Bungalow",
      shortDescription: "Quiet standalone unit near the garden.",
      guestCapacity: 2,
      basePrice: {
        amountMinor: 180_000,
        currency: "THB",
      },
      active: true,
    });
    expect(unitDetailsToPersistence(unit)).toEqual({
      name: "Garden Bungalow",
      shortDescription: "Quiet standalone unit near the garden.",
      guestCapacity: 2,
      basePriceMinor: 180_000,
      currency: "THB",
    });
  });

  it("rejects missing details, non-positive guest capacity, and invalid base prices", () => {
    expect(() =>
      createActiveUnit({
        name: "",
        shortDescription: "Quiet standalone unit near the garden.",
        guestCapacity: 2,
        basePriceMinor: 180_000,
        currency: "THB",
      })
    ).toThrow("Unit name is required");
    expect(() =>
      createActiveUnit({
        name: "Garden Bungalow",
        shortDescription: "",
        guestCapacity: 2,
        basePriceMinor: 180_000,
        currency: "THB",
      })
    ).toThrow("Unit short description is required");
    expect(() =>
      createActiveUnit({
        name: "Garden Bungalow",
        shortDescription: "Quiet standalone unit near the garden.",
        guestCapacity: 0,
        basePriceMinor: 180_000,
        currency: "THB",
      })
    ).toThrow("Unit guest capacity must be positive");
    expect(() =>
      createActiveUnit({
        name: "Garden Bungalow",
        shortDescription: "Quiet standalone unit near the garden.",
        guestCapacity: 2,
        basePriceMinor: 0,
        currency: "THB",
      })
    ).toThrow("Money amount must be positive");
  });

  it("updates Unit details without changing active state", () => {
    const inactiveUnit = setUnitActiveState(
      createActiveUnit({
        name: "Garden Bungalow",
        shortDescription: "Quiet standalone unit near the garden.",
        guestCapacity: 2,
        basePriceMinor: 180_000,
        currency: "THB",
      }),
      false
    );

    const unit = updateUnitDetails(inactiveUnit, {
      name: "Canal Bungalow",
      shortDescription: "Updated unit beside the canal.",
      guestCapacity: 3,
      basePriceMinor: 220_000,
      currency: "THB",
    });

    expect(unit).toEqual({
      name: "Canal Bungalow",
      shortDescription: "Updated unit beside the canal.",
      guestCapacity: 3,
      basePrice: {
        amountMinor: 220_000,
        currency: "THB",
      },
      active: false,
    });
  });

  it("transitions Units between active and inactive without deleting details", () => {
    const activeUnit = createActiveUnit({
      name: "Garden Bungalow",
      shortDescription: "Quiet standalone unit near the garden.",
      guestCapacity: 2,
      basePriceMinor: 180_000,
      currency: "THB",
    });

    const inactiveUnit = setUnitActiveState(activeUnit, false);
    const reactivatedUnit = setUnitActiveState(inactiveUnit, true);

    expect(inactiveUnit).toMatchObject({
      name: "Garden Bungalow",
      active: false,
    });
    expect(reactivatedUnit).toMatchObject({
      name: "Garden Bungalow",
      active: true,
    });
  });
});
