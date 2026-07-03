import { z } from "zod";
import { CONVERSATION_SOURCES } from "@/lib/constants/enums";

export const conversationSourceSchema = z.enum(CONVERSATION_SOURCES);

/** Body accepted by POST /api/conversations — customer already exists. */
export const ingestConversationSchema = z.object({
  customerId: z.string().min(1, "customerId is required"),
  rawText: z.string().trim().min(1, "rawText is required"),
  source: conversationSourceSchema.optional(),
  occurredAt: z.coerce.date().optional(),
});
export type IngestConversationInput = z.infer<typeof ingestConversationSchema>;

/**
 * Body accepted by POST /api/webhooks/n8n — the n8n Messenger workflow may
 * be forwarding a brand-new contact, so the customer is identified/created
 * by Messenger thread ID rather than requiring an existing customerId.
 */
export const ingestWebhookConversationSchema = z.object({
  messengerThreadId: z.string().trim().min(1, "messengerThreadId is required"),
  customerName: z.string().trim().min(1, "customerName is required"),
  facebookProfileUrl: z.url().optional().or(z.literal("")),
  rawText: z.string().trim().min(1, "rawText is required"),
  occurredAt: z.coerce.date().optional(),
});
export type IngestWebhookConversationInput = z.infer<
  typeof ingestWebhookConversationSchema
>;
