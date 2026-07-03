import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DEFAULT_MODEL, getAnthropicClient } from "@/core/ai/client";
import {
  conversationExtractionSchema,
  type ConversationExtraction,
} from "@/modules/marketplace/validation/extraction";

const SYSTEM_PROMPT = `You extract structured buying signals from Facebook Marketplace seller conversations.
Read the conversation excerpt and identify what the customer wants, their budget, urgency, location,
buying intent, sentiment, and any follow-ups the seller should do. Be conservative: if something
wasn't actually said, leave it null/empty rather than guessing. Keywords should be short, lowercase,
and useful for matching against inventory listings (product names, brands, categories, synonyms).`;

/**
 * Calls Claude to extract structured fields from a raw conversation excerpt.
 * Returns validated data matching conversationExtractionSchema — callers
 * persist these fields directly onto the MarketplaceConversation row and
 * never need to touch Claude's raw response. See
 * docs/decisions/0005-ai-extraction-structured-storage.md.
 */
export async function extractConversationInsights(rawText: string): Promise<{
  extraction: ConversationExtraction;
  model: string;
  raw: unknown;
}> {
  const client = getAnthropicClient();

  const message = await client.messages.parse({
    model: DEFAULT_MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: rawText }],
    output_config: {
      format: zodOutputFormat(conversationExtractionSchema),
    },
  });

  if (!message.parsed_output) {
    throw new Error("Claude did not return a parseable extraction result");
  }

  return {
    extraction: message.parsed_output,
    model: DEFAULT_MODEL,
    raw: message,
  };
}
