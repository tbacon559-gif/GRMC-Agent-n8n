import { describe, expect, it } from "vitest";
import { centsToDollars, dollarsToCents, formatCents } from "@/lib/money";

describe("money helpers", () => {
  it("converts dollars to cents without float drift", () => {
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });

  it("converts cents back to dollars", () => {
    expect(centsToDollars(1999)).toBe(19.99);
  });

  it("formats cents as USD currency", () => {
    expect(formatCents(1999)).toBe("$19.99");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats null/undefined as an em dash", () => {
    expect(formatCents(null)).toBe("—");
    expect(formatCents(undefined)).toBe("—");
  });
});
