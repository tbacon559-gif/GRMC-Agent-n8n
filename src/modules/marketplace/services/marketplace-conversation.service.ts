import { extractConversationInsights } from "@/modules/marketplace/ai/extraction";
import { marketplaceConversationRepository } from "@/modules/marketplace/repositories/marketplace-conversation.repository";
import { marketplaceInterestRepository } from "@/modules/marketplace/repositories/marketplace-interest.repository";
import { contactRepository } from "@/core/repositories/contact.repository";
import { memoryRepository } from "@/core/repositories/memory.repository";
import { taskRepository } from "@/core/repositories/task.repository";
import type { ConversationExtraction } from "@/modules/marketplace/validation/extraction";
import type { ConversationSource } from "@/modules/marketplace/constants/enums";

export interface IngestConversationParams {
  contactId: string;
  rawText: string;
  source?: ConversationSource;
  occurredAt?: Date;
}

export interface IngestConversationResult {
  conversationId: string;
  extraction: ConversationExtraction;
}

/**
 * The "Conversation Intelligence" pipeline: run the raw text through Claude,
 * persist the structured result, and fan out the side effects a seller
 * cares about — a searchable interest for the matching engine, concrete
 * follow-up tasks, an updated last-contact timestamp, a refreshed AI
 * summary cache, and a durable append-only memory entry.
 *
 * The summary cache is a rolling "last known state" (a deliberate MVP
 * simplification — see docs/decisions/0005), but nothing is ever lost:
 * every ingested conversation also appends a ContactMemoryEntry, which is
 * never overwritten. See docs/decisions/0009-ai-memory-append-only-log.md.
 */
export async function ingestConversation(
  params: IngestConversationParams,
): Promise<IngestConversationResult> {
  const occurredAt = params.occurredAt ?? new Date();
  const { extraction, model, raw } = await extractConversationInsights(params.rawText);

  const conversation = await marketplaceConversationRepository.create({
    contact: { connect: { id: params.contactId } },
    source: params.source ?? "messenger",
    rawText: params.rawText,
    occurredAt,
    interestedItem: extraction.interestedItem,
    requestedItems: extraction.requestedItems,
    budgetCents: extraction.budgetCents,
    budgetNote: extraction.budgetNote,
    urgency: extraction.urgency ?? undefined,
    city: extraction.city,
    buyingIntent: extraction.buyingIntent ?? undefined,
    sentiment: extraction.sentiment ?? undefined,
    summary: extraction.summary,
    extractionModel: model,
    extractionRaw: raw as object,
  });

  if (extraction.interestedItem || extraction.requestedItems.length) {
    const itemDescription = extraction.interestedItem ?? extraction.requestedItems.join(", ");
    await marketplaceInterestRepository.create({
      contactId: params.contactId,
      conversationId: conversation.id,
      itemDescription,
      keywords: extraction.keywords,
      budgetCents: extraction.budgetCents,
    });
  }

  await Promise.all(
    extraction.followUpReminders.map((reminder) => {
      const dueAt = new Date(occurredAt);
      dueAt.setDate(dueAt.getDate() + reminder.dueInDays);
      return taskRepository.create({
        title: reminder.note,
        dueAt,
        module: "marketplace",
        contactId: params.contactId,
        sourceType: "MarketplaceConversation",
        sourceId: conversation.id,
      });
    }),
  );

  await contactRepository.touchLastContact(params.contactId, occurredAt);
  await contactRepository.updateAiSummaryCache(params.contactId, extraction.summary);
  await memoryRepository.create({
    contactId: params.contactId,
    module: "marketplace",
    kind: "summary",
    content: extraction.summary,
    sourceType: "MarketplaceConversation",
    sourceId: conversation.id,
  });

  return { conversationId: conversation.id, extraction };
}
