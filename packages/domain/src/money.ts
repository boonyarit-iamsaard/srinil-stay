export const SUPPORTED_CURRENCIES = ["THB"] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface Money {
  amountMinor: number;
  currency: Currency;
}

export interface MoneyInput {
  amountMinor: number;
  currency: string;
}

export interface MajorUnitMoneyInput {
  amount: number;
  currency: string;
}

const MINOR_UNITS_PER_MAJOR_UNIT = 100;
const THAI_BAHT_LOCALE = "th-TH";

export function createMoney(input: MoneyInput): Money {
  if (!isSupportedCurrency(input.currency)) {
    throw new Error("Unsupported currency");
  }
  if (!Number.isInteger(input.amountMinor)) {
    throw new Error("Money amount must be an integer minor-unit value");
  }

  return {
    amountMinor: input.amountMinor,
    currency: input.currency,
  };
}

export function createPositiveMoney(input: MoneyInput): Money {
  const money = createMoney(input);
  if (money.amountMinor <= 0) {
    throw new Error("Money amount must be positive");
  }

  return money;
}

export function moneyFromMajorUnit(input: MajorUnitMoneyInput): Money {
  return createMoney({
    amountMinor: input.amount * MINOR_UNITS_PER_MAJOR_UNIT,
    currency: input.currency,
  });
}

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat(THAI_BAHT_LOCALE, {
    style: "currency",
    currency: money.currency,
  }).format(money.amountMinor / MINOR_UNITS_PER_MAJOR_UNIT);
}

export function moneyToMajorUnit(money: Money): number {
  return money.amountMinor / MINOR_UNITS_PER_MAJOR_UNIT;
}

function isSupportedCurrency(currency: string): currency is Currency {
  return SUPPORTED_CURRENCIES.some(
    (supportedCurrency) => supportedCurrency === currency
  );
}
