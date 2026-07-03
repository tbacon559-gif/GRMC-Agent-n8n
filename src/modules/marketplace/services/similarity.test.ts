import { describe, expect, it } from "vitest";
import { clamp, keywordSimilarity, overlappingKeywords, recencyScore } from "@/modules/marketplace/services/similarity";

describe("keywordSimilarity", () => {
  it("returns 100 for identical keyword sets", () => {
    expect(keywordSimilarity(["kitchenaid", "mixer"], ["mixer", "kitchenaid"])).toBe(100);
  });

  it("returns 0 when there is no overlap", () => {
    expect(keywordSimilarity(["patio", "outdoor"], ["espresso", "coffee"])).toBe(0);
  });

  it("returns 0 when either side is empty", () => {
    expect(keywordSimilarity([], ["mixer"])).toBe(0);
    expect(keywordSimilarity(["mixer"], [])).toBe(0);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(keywordSimilarity([" KitchenAid "], ["kitchenaid"])).toBe(100);
  });

  it("computes partial overlap as a Jaccard ratio", () => {
    // intersection {b, c} = 2, union {a, b, c, d} = 4 -> 50
    expect(keywordSimilarity(["a", "b", "c"], ["b", "c", "d"])).toBe(50);
  });

  it("ignores non-string entries and non-array input", () => {
    expect(keywordSimilarity(["mixer", 42, null], ["mixer"])).toBe(100);
    expect(keywordSimilarity("not-an-array", ["mixer"])).toBe(0);
  });
});

describe("overlappingKeywords", () => {
  it("returns the keywords from b that also appear in a", () => {
    expect(overlappingKeywords(["a", "b"], ["b", "c"])).toEqual(["b"]);
  });
});

describe("recencyScore", () => {
  const now = new Date("2026-01-31T00:00:00Z");

  it("returns 100 for a date of exactly now", () => {
    expect(recencyScore(now, now, 30)).toBe(100);
  });

  it("halves at the half-life boundary", () => {
    const halfLifeAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(recencyScore(halfLifeAgo, now, 30)).toBe(50);
  });

  it("returns the fallback for null/undefined dates", () => {
    expect(recencyScore(null, now, 30, 42)).toBe(42);
    expect(recencyScore(undefined, now, 30)).toBe(30);
  });

  it("never goes negative for a future date", () => {
    const future = new Date(now.getTime() + 1000);
    expect(recencyScore(future, now, 30)).toBe(100);
  });
});

describe("clamp", () => {
  it("clamps values into range", () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
  });
});
