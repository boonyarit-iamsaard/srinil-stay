import type { Currency, Money } from "./money";
import { createPositiveMoney } from "./money";

export interface UnitDetailsInput {
  basePriceMinor: number;
  currency: string;
  guestCapacity: number;
  name: string;
  shortDescription: string;
}

export interface UnitDetails {
  basePrice: Money;
  guestCapacity: number;
  name: string;
  shortDescription: string;
}

export interface Unit extends UnitDetails {
  active: boolean;
}

export interface UnitDetailsPersistence {
  basePriceMinor: number;
  currency: Currency;
  guestCapacity: number;
  name: string;
  shortDescription: string;
}

export interface UnitPersistence extends UnitDetailsPersistence {
  active: boolean;
}

export class UnitValidationError extends Error {}

export function createUnitDetails(input: UnitDetailsInput): UnitDetails {
  if (input.name.length === 0) {
    throw new UnitValidationError("Unit name is required");
  }
  if (input.shortDescription.length === 0) {
    throw new UnitValidationError("Unit short description is required");
  }
  if (!Number.isInteger(input.guestCapacity) || input.guestCapacity <= 0) {
    throw new UnitValidationError("Unit guest capacity must be positive");
  }

  const basePrice = createUnitBasePrice(input);

  return {
    name: input.name,
    shortDescription: input.shortDescription,
    guestCapacity: input.guestCapacity,
    basePrice,
  };
}

export function createActiveUnit(input: UnitDetailsInput): Unit {
  return {
    ...createUnitDetails(input),
    active: true,
  };
}

export function updateUnitDetails(unit: Unit, input: UnitDetailsInput): Unit {
  return {
    ...unit,
    ...createUnitDetails(input),
  };
}

export function setUnitActiveState(unit: Unit, active: boolean): Unit {
  return {
    ...unit,
    active,
  };
}

export function unitFromPersistence(input: UnitPersistence): Unit {
  return {
    ...createUnitDetails(input),
    active: input.active,
  };
}

export function unitDetailsToPersistence(
  unitDetails: UnitDetails
): UnitDetailsPersistence {
  return {
    name: unitDetails.name,
    shortDescription: unitDetails.shortDescription,
    guestCapacity: unitDetails.guestCapacity,
    basePriceMinor: unitDetails.basePrice.amountMinor,
    currency: unitDetails.basePrice.currency,
  };
}

function createUnitBasePrice(input: UnitDetailsInput): Money {
  try {
    return createPositiveMoney({
      amountMinor: input.basePriceMinor,
      currency: input.currency,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new UnitValidationError(error.message);
    }

    throw error;
  }
}
