import { describe, expect, it } from "vitest";
import type { Customer, CustomerInterest, InventoryItem } from "@/generated/prisma/client";
import { scoreInterest } from "@/lib/services/matching.service";

const NOW = new Date("2026-07-01T00:00:00Z");

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1",
    name: "Test Customer",
    facebookProfileUrl: null,
    messengerThreadId: null,
    phone: null,
    email: null,
    status: "prospect",
    aiSummary: null,
    reliabilityScore: 50,
    responsivenessScore: 50,
    lastContactAt: null,
    totalPurchases: 0,
    lifetimeSpendCents: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeInterest(overrides: Partial<CustomerInterest> = {}): CustomerInterest {
  return {
    id: "interest-1",
    customerId: "customer-1",
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

function makeItem(overrides: Partial<Pick<InventoryItem, "categoryId" | "keywords">> = {}) {
  return { categoryId: "kitchen", keywords: ["kitchenaid", "stand mixer"], ...overrides };
}

describe("scoreInterest", () => {
  it("scores highest for an exact category + keyword match with a reliable, responsive repeat buyer", () => {
    const customer = makeCustomer({
      totalPurchases: 3,
      reliabilityScore: 90,
      responsivenessScore: 90,
      lastContactAt: NOW,
    });
    const { score, breakdown } = scoreInterest(makeItem(), makeInterest(), customer, NOW);

    expect(score).toBeGreaterThan(80);
    expect(breakdown.similarity).toBe(100);
    expect(breakdown.reasons).toContain("Interested in this category");
    expect(breakdown.reasons.some((r) => r.startsWith("Matches keywords"))).toBe(true);
    expect(breakdown.reasons.some((r) => r.includes("Repeat customer"))).toBe(true);
  });

  it("scores low when neither category nor keywords match", () => {
    const customer = makeCustomer();
    const item = makeItem({ categoryId: "patio", keywords: ["patio set", "outdoor furniture"] });
    const { score, breakdown } = scoreInterest(item, makeInterest(), customer, NOW);

    expect(score).toBeLessThan(30);
    expect(breakdown.similarity).toBe(0);
    expect(breakdown.reasons).not.toContain("Interested in this category");
  });

  it("still gives partial credit for category match alone, without keyword overlap", () => {
    const item = makeItem({ categoryId: "kitchen", keywords: ["espresso machine", "coffee"] });
    const { breakdown } = scoreInterest(item, makeInterest(), makeCustomer(), NOW);

    expect(breakdown.similarity).toBe(60);
    expect(breakdown.reasons).toContain("Interested in this category");
    expect(breakdown.reasons.some((r) => r.startsWith("Matches keywords"))).toBe(false);
  });

  it("flags customers who have never been contacted", () => {
    const { breakdown } = scoreInterest(makeItem(), makeInterest(), makeCustomer({ lastContactAt: null }), NOW);
    expect(breakdown.reasons).toContain("Never contacted before");
  });

  it("rewards recent contact over stale contact, all else equal", () => {
    const recentlyContacted = makeCustomer({ lastContactAt: NOW });
    const staleContact = makeCustomer({
      lastContactAt: new Date(NOW.getTime() - 90 * 24 * 60 * 60 * 1000),
    });

    const recentScore = scoreInterest(makeItem(), makeInterest(), recentlyContacted, NOW).score;
    const staleScore = scoreInterest(makeItem(), makeInterest(), staleContact, NOW).score;

    expect(recentScore).toBeGreaterThan(staleScore);
  });
});
