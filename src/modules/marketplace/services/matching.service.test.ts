import { describe, expect, it } from "vitest";
import type { MarketplaceInterest, MarketplaceItem } from "@/generated/prisma/client";
import { scoreInterest, type ContactScoringContext } from "@/modules/marketplace/services/matching.service";

const NOW = new Date("2026-07-01T00:00:00Z");

function makeScoringContext(overrides: Partial<ContactScoringContext> = {}): ContactScoringContext {
  return {
    lastContactAt: null,
    reliabilityScore: 50,
    responsivenessScore: 50,
    purchaseCount: 0,
    ...overrides,
  };
}

function makeInterest(overrides: Partial<MarketplaceInterest> = {}): MarketplaceInterest {
  return {
    id: "interest-1",
    contactId: "contact-1",
    conversationId: null,
    categoryId: "kitchen",
    itemDescription: "stand mixer",
    keywords: ["kitchenaid", "stand mixer"],
    budgetCents: null,
    status: "open",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeItem(overrides: Partial<Pick<MarketplaceItem, "categoryId" | "keywords">> = {}) {
  return { categoryId: "kitchen", keywords: ["kitchenaid", "stand mixer"], ...overrides };
}

describe("scoreInterest", () => {
  it("scores highest for an exact category + keyword match with a reliable, responsive repeat buyer", () => {
    const scoringContext = makeScoringContext({
      purchaseCount: 3,
      reliabilityScore: 90,
      responsivenessScore: 90,
      lastContactAt: NOW,
    });
    const { score, breakdown } = scoreInterest(makeItem(), makeInterest(), scoringContext, NOW);

    expect(score).toBeGreaterThan(80);
    expect(breakdown.similarity).toBe(100);
    expect(breakdown.reasons).toContain("Interested in this category");
    expect(breakdown.reasons.some((r) => r.startsWith("Matches keywords"))).toBe(true);
    expect(breakdown.reasons.some((r) => r.includes("Repeat customer"))).toBe(true);
  });

  it("scores low when neither category nor keywords match", () => {
    const scoringContext = makeScoringContext();
    const item = makeItem({ categoryId: "patio", keywords: ["patio set", "outdoor furniture"] });
    const { score, breakdown } = scoreInterest(item, makeInterest(), scoringContext, NOW);

    expect(score).toBeLessThan(30);
    expect(breakdown.similarity).toBe(0);
    expect(breakdown.reasons).not.toContain("Interested in this category");
  });

  it("still gives partial credit for category match alone, without keyword overlap", () => {
    const item = makeItem({ categoryId: "kitchen", keywords: ["espresso machine", "coffee"] });
    const { breakdown } = scoreInterest(item, makeInterest(), makeScoringContext(), NOW);

    expect(breakdown.similarity).toBe(60);
    expect(breakdown.reasons).toContain("Interested in this category");
    expect(breakdown.reasons.some((r) => r.startsWith("Matches keywords"))).toBe(false);
  });

  it("flags contacts who have never been contacted", () => {
    const { breakdown } = scoreInterest(makeItem(), makeInterest(), makeScoringContext({ lastContactAt: null }), NOW);
    expect(breakdown.reasons).toContain("Never contacted before");
  });

  it("rewards recent contact over stale contact, all else equal", () => {
    const recentlyContacted = makeScoringContext({ lastContactAt: NOW });
    const staleContact = makeScoringContext({
      lastContactAt: new Date(NOW.getTime() - 90 * 24 * 60 * 60 * 1000),
    });

    const recentScore = scoreInterest(makeItem(), makeInterest(), recentlyContacted, NOW).score;
    const staleScore = scoreInterest(makeItem(), makeInterest(), staleContact, NOW).score;

    expect(recentScore).toBeGreaterThan(staleScore);
  });
});
