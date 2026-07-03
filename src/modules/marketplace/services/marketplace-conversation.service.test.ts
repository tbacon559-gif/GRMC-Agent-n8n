import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { contactRepository } from "@/core/repositories/contact.repository";
import { memoryRepository } from "@/core/repositories/memory.repository";
import { taskRepository } from "@/core/repositories/task.repository";
import { marketplaceConversationRepository } from "@/modules/marketplace/repositories/marketplace-conversation.repository";
import { marketplaceInterestRepository } from "@/modules/marketplace/repositories/marketplace-interest.repository";
import type { ConversationExtraction } from "@/modules/marketplace/validation/extraction";

vi.mock("@/modules/marketplace/ai/extraction", () => ({
  extractConversationInsights: vi.fn(),
}));

const { extractConversationInsights } = await import("@/modules/marketplace/ai/extraction");
const { ingestConversation } = await import("@/modules/marketplace/services/marketplace-conversation.service");

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
 * The extraction call itself (src/modules/marketplace/ai/extraction.ts) is a
 * thin wrapper around the Anthropic SDK — not worth hitting the real API in
 * tests. This mocks that one call and exercises everything ingestConversation
 * actually does with the result against a real database: the
 * MarketplaceConversation row, the MarketplaceInterest/Task fan-out, the
 * Contact updates, and the append-only ContactMemoryEntry.
 */
describe("marketplace-conversation.service (integration, AI extraction mocked)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists structured fields and fans out interests, tasks, contact updates, and memory", async () => {
    vi.mocked(extractConversationInsights).mockResolvedValueOnce({
      extraction: mockExtraction(),
      model: "test-model",
      raw: { fake: "response" },
    });

    const contact = await contactRepository.create({ name: "Ingest Test Contact" });
    const occurredAt = new Date("2026-01-01T00:00:00Z");

    const result = await ingestConversation({
      contactId: contact.id,
      rawText: "Do you ever get espresso machines in?",
      occurredAt,
    });

    expect(result.extraction.interestedItem).toBe("espresso machine");

    const conversation = await marketplaceConversationRepository.findById(result.conversationId);
    expect(conversation).toMatchObject({
      contactId: contact.id,
      interestedItem: "espresso machine",
      budgetCents: 9000,
      urgency: "low",
      sentiment: "positive",
    });

    const interests = await marketplaceInterestRepository.listByContact(contact.id);
    expect(interests).toHaveLength(1);
    expect(interests[0].itemDescription).toBe("espresso machine");

    const tasks = await taskRepository.list({ contactId: contact.id });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Check back in a week");
    expect(tasks[0].module).toBe("marketplace");
    expect(tasks[0].dueAt?.toISOString()).toBe(new Date("2026-01-08T00:00:00Z").toISOString());

    const updatedContact = await contactRepository.findById(contact.id);
    expect(updatedContact!.lastContactAt?.toISOString()).toBe(occurredAt.toISOString());
    expect(updatedContact!.aiSummaryCache).toBe("Wants an espresso machine if the price is right.");

    const memoryEntries = await memoryRepository.listByContact(contact.id);
    expect(memoryEntries).toHaveLength(1);
    expect(memoryEntries[0]).toMatchObject({ module: "marketplace", kind: "summary" });
  });

  it("does not create an interest when nothing was requested", async () => {
    vi.mocked(extractConversationInsights).mockResolvedValueOnce({
      extraction: mockExtraction({ interestedItem: null, requestedItems: [] }),
      model: "test-model",
      raw: {},
    });

    const contact = await contactRepository.create({ name: "Ingest Test No Interest" });
    await ingestConversation({ contactId: contact.id, rawText: "just saying hi" });

    const interests = await marketplaceInterestRepository.listByContact(contact.id);
    expect(interests).toHaveLength(0);
  });
});
