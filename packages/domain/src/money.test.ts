import { describe, expect, it } from "vitest";

import {
  createMoney,
  createPositiveMoney,
  formatMoney,
  moneyFromMajorUnit,
  moneyToMajorUnit,
} from "./money";

describe("Money", () => {
  it("represents a Thai baht amount in integer minor units", () => {
    expect(createMoney({ amountMinor: 180_000, currency: "THB" })).toEqual({
      amountMinor: 180_000,
      currency: "THB",
    });
  });

  it("rejects unsupported currencies and fractional minor units", () => {
    expect(() =>
      createMoney({ amountMinor: 180_000, currency: "USD" })
    ).toThrow("Unsupported currency");
    expect(() =>
      createMoney({ amountMinor: 180_000.5, currency: "THB" })
    ).toThrow("Money amount must be an integer minor-unit value");
  });

  it("rejects non-positive Unit base prices", () => {
    expect(() =>
      createPositiveMoney({ amountMinor: 0, currency: "THB" })
    ).toThrow("Money amount must be positive");
    expect(() =>
      createPositiveMoney({ amountMinor: -100, currency: "THB" })
    ).toThrow("Money amount must be positive");
  });

  it("converts whole baht values to minor units and formats Thai baht", () => {
    const money = moneyFromMajorUnit({ amount: 1800, currency: "THB" });

    expect(money).toEqual({ amountMinor: 180_000, currency: "THB" });
    expect(formatMoney(money)).toBe("฿1,800.00");
    expect(moneyToMajorUnit(money)).toBe(1800);
  });
});
