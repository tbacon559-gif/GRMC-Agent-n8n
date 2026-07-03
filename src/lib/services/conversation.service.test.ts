import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { conversationRepository } from "@/lib/repositories/conversation.repository";
import { interestRepository } from "@/lib/repositories/interest.repository";
import { reminderRepository } from "@/lib/repositories/reminder.repository";
import type { ConversationExtraction } from "@/lib/validation/extraction";

vi.mock("@/lib/ai/extraction", () => ({
  extractConversationInsights: vi.fn(),
}));

const { extractConversationInsights } = await import("@/lib/ai/extraction");
const { ingestConversation } = await import("@/lib/services/conversation.service");

function mockExtraction(overrides: Partial<ConversationExtraction> = {}): ConversationExtraction {
  return {
    interestedItem: "espresso machine",
    requestedItems: ["espresso machine"],
    keywords: ["espresso machine", "coffee"],
    budgetCents: 9000,
    budgetNote: null,
    urgency: "low",
    city: null,
    buyingIntent: "medium",
    sentiment: "positive",
    summary: "Wants an espresso machine if the price is right.",
    followUpReminders: [{ note: "Check back in a week", dueInDays: 7 }],
    ...overrides,
  };
}

/**
 * The extraction call itself (src/lib/ai/extraction.ts) is a thin wrapper
 * around the Anthropic SDK — not worth hitting the real API in tests. This
 * mocks that one call and exercises everything ingestConversation actually
 * does with the result against a real database: the Conversation row, the
 * CustomerInterest/FollowUpReminder fan-out, and the Customer updates.
 */
describe("conversation.service (integration, AI extraction mocked)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists structured fields and fans out interests, reminders, and customer updates", async () => {
    vi.mocked(extractConversationInsights).mockResolvedValueOnce({
      extraction: mockExtraction(),
      model: "test-model",
      raw: { fake: "response" },
    });

    const customer = await customerRepository.create({ name: "Ingest Test Customer" });
    const occurredAt = new Date("2026-01-01T00:00:00Z");

    const result = await ingestConversation({
      customerId: customer.id,
      rawText: "Do you ever get espresso machines in?",
      occurredAt,
    });

    expect(result.extraction.interestedItem).toBe("espresso machine");

    const conversation = await conversationRepository.findById(result.conversationId);
    expect(conversation).toMatchObject({
      customerId: customer.id,
      interestedItem: "espresso machine",
      budgetCents: 9000,
      urgency: "low",
      sentiment: "positive",
    });

    const interests = await interestRepository.listByCustomer(customer.id);
    expect(interests).toHaveLength(1);
    expect(interests[0].itemDescription).toBe("espresso machine");

    const reminders = await reminderRepository.listUpcoming(50);
    const ourReminder = reminders.find((r) => r.customerId === customer.id);
    expect(ourReminder?.note).toBe("Check back in a week");
    expect(ourReminder?.dueAt.toISOString()).toBe(new Date("2026-01-08T00:00:00Z").toISOString());

    const updatedCustomer = await customerRepository.findById(customer.id);
    expect(updatedCustomer!.lastContactAt?.toISOString()).toBe(occurredAt.toISOString());
    expect(updatedCustomer!.aiSummary).toBe("Wants an espresso machine if the price is right.");
  });

  it("does not create an interest when nothing was requested", async () => {
    vi.mocked(extractConversationInsights).mockResolvedValueOnce({
      extraction: mockExtraction({ interestedItem: null, requestedItems: [] }),
      model: "test-model",
      raw: {},
    });

    const customer = await customerRepository.create({ name: "Ingest Test No Interest" });
    await ingestConversation({ customerId: customer.id, rawText: "just saying hi" });

    const interests = await interestRepository.listByCustomer(customer.id);
    expect(interests).toHaveLength(0);
  });
});
