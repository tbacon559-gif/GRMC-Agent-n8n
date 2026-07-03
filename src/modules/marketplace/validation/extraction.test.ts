import { describe, expect, it } from "vitest";
import { conversationExtractionSchema } from "@/modules/marketplace/validation/extraction";

const VALID_EXTRACTION = {
  interestedItem: "KitchenAid stand mixer",
  requestedItems: ["kitchenaid stand mixer"],
  keywords: ["kitchenaid", "stand mixer", "kitchen appliance"],
  budgetCents: 10000,
  budgetNote: null,
  urgency: "medium",
  city: null,
  buyingIntent: "high",
  sentiment: "positive",
  summary: "Sam wants a KitchenAid mixer, budget around $100.",
  followUpReminders: [{ note: "Check back with Sam", dueInDays: 3 }],
};

describe("conversationExtractionSchema", () => {
  it("accepts a well-formed extraction", () => {
    const result = conversationExtractionSchema.safeParse(VALID_EXTRACTION);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid urgency value", () => {
    const result = conversationExtractionSchema.safeParse({ ...VALID_EXTRACTION, urgency: "asap" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative dueInDays", () => {
    const result = conversationExtractionSchema.safeParse({
      ...VALID_EXTRACTION,
      followUpReminders: [{ note: "x", dueInDays: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("requires requestedItems and keywords to be arrays", () => {
    const result = conversationExtractionSchema.safeParse({
      ...VALID_EXTRACTION,
      requestedItems: "kitchenaid mixer",
    });
    expect(result.success).toBe(false);
  });

  it("allows nullable fields to be null", () => {
    const result = conversationExtractionSchema.safeParse({
      ...VALID_EXTRACTION,
      interestedItem: null,
      urgency: null,
      city: null,
      buyingIntent: null,
      sentiment: null,
      budgetCents: null,
    });
    expect(result.success).toBe(true);
  });
});
