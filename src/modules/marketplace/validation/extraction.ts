import { z } from "zod";
import { BUYING_INTENT_LEVELS, SENTIMENTS, URGENCY_LEVELS } from "@/modules/marketplace/constants/enums";

/**
 * Shape of the structured data Claude extracts from a conversation. This
 * schema is the contract the AI must fill out — see
 * src/modules/marketplace/ai/extraction.ts, which forces a tool call
 * against it. The app only ever reads these validated fields, never
 * Claude's raw prose. See docs/decisions/0005-ai-extraction-structured-storage.md.
 */
export const conversationExtractionSchema = z.object({
  interestedItem: z
    .string()
    .nullable()
    .describe("The specific item the customer is most interested in right now, or null."),
  requestedItems: z
    .array(z.string())
    .describe("Every distinct item/category the customer asked about."),
  keywords: z
    .array(z.string())
    .describe(
      "Short lowercase keywords/synonyms describing what the customer wants, for matching against inventory (e.g. ['kitchenaid', 'stand mixer', 'small appliance']).",
    ),
  budgetCents: z
    .number()
    .int()
    .nullable()
    .describe("Budget in integer cents if a specific number was mentioned, else null."),
  budgetNote: z
    .string()
    .nullable()
    .describe("Freeform budget context when no exact number was given, e.g. 'under 100 bucks'."),
  urgency: z.enum(URGENCY_LEVELS).nullable(),
  city: z.string().nullable().describe("City/area mentioned, for local pickup logistics."),
  buyingIntent: z.enum(BUYING_INTENT_LEVELS).nullable(),
  sentiment: z.enum(SENTIMENTS).nullable(),
  summary: z.string().describe("2-3 sentence summary of the conversation."),
  followUpReminders: z
    .array(
      z.object({
        note: z.string(),
        dueInDays: z
          .number()
          .int()
          .min(0)
          .describe("Days from now this follow-up should happen."),
      }),
    )
    .describe("Concrete follow-ups the seller should do, if any."),
});
export type ConversationExtraction = z.infer<typeof conversationExtractionSchema>;
