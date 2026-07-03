import { z } from "zod";
import { CONVERSATION_SOURCES } from "@/modules/marketplace/constants/enums";

export const conversationSourceSchema = z.enum(CONVERSATION_SOURCES);

/** Body accepted by POST /api/marketplace/conversations — contact already exists. */
export const ingestConversationSchema = z.object({
  contactId: z.string().min(1, "contactId is required"),
  rawText: z.string().trim().min(1, "rawText is required"),
  source: conversationSourceSchema.optional(),
  occurredAt: z.coerce.date().optional(),
});
export type IngestConversationInput = z.infer<typeof ingestConversationSchema>;

/**
 * Body accepted by POST /api/webhooks/n8n — the n8n Messenger workflow may
 * be forwarding a brand-new contact, so the contact is identified/created by
 * Messenger thread ID rather than requiring an existing contactId. Field
 * names here are an external contract (n8n/workflows/messenger-conversation-ingest.json
 * hardcodes them) and are kept as `customerName` even though the internal
 * model is now Contact — see docs/decisions/0008-n8n-webhook-integration.md
 * and docs/decisions/0013-founder-os-rebrand-route-map.md.
 */
export const ingestWebhookConversationSchema = z.object({
  messengerThreadId: z.string().trim().min(1, "messengerThreadId is required"),
  customerName: z.string().trim().min(1, "customerName is required"),
  facebookProfileUrl: z.url().optional().or(z.literal("")),
  rawText: z.string().trim().min(1, "rawText is required"),
  occurredAt: z.coerce.date().optional(),
});
export type IngestWebhookConversationInput = z.infer<typeof ingestWebhookConversationSchema>;
