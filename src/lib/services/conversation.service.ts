import { extractConversationInsights } from "@/lib/ai/extraction";
import { conversationRepository } from "@/lib/repositories/conversation.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { interestRepository } from "@/lib/repositories/interest.repository";
import { reminderRepository } from "@/lib/repositories/reminder.repository";
import type { ConversationExtraction } from "@/lib/validation/extraction";
import type { ConversationSource } from "@/lib/constants/enums";

export interface IngestConversationParams {
  customerId: string;
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
 * follow-up reminders, an updated last-contact timestamp, and a refreshed
 * AI summary on the customer.
 *
 * The AI summary is currently the most recent conversation's summary
 * (a rolling "last known state" rather than a synthesis across history) —
 * a deliberate MVP simplification. See
 * docs/decisions/0005-ai-extraction-structured-storage.md for the reasoning
 * and the upgrade path.
 */
export async function ingestConversation(
  params: IngestConversationParams,
): Promise<IngestConversationResult> {
  const occurredAt = params.occurredAt ?? new Date();
  const { extraction, model, raw } = await extractConversationInsights(params.rawText);

  const conversation = await conversationRepository.create({
    customer: { connect: { id: params.customerId } },
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
    const itemDescription =
      extraction.interestedItem ?? extraction.requestedItems.join(", ");
    await interestRepository.create({
      customerId: params.customerId,
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
      return reminderRepository.create({
        customerId: params.customerId,
        conversationId: conversation.id,
        dueAt,
        note: reminder.note,
      });
    }),
  );

  await customerRepository.touchLastContact(params.customerId, occurredAt);
  await customerRepository.updateAiSummary(params.customerId, extraction.summary);

  return { conversationId: conversation.id, extraction };
}
