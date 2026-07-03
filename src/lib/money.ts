/**
 * All money is stored as integer cents (never floats) to avoid rounding
 * drift across thousands of transactions. See
 * docs/decisions/0002-money-as-integer-cents.md.
 */

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return centsToDollars(cents).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
