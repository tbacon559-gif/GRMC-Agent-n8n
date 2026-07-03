import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { env } from "@/lib/env";
import { UnauthorizedError } from "@/lib/errors";
import { contactRepository } from "@/core/repositories/contact.repository";
import { ingestConversation } from "@/modules/marketplace/services/marketplace-conversation.service";
import { ingestWebhookConversationSchema } from "@/modules/marketplace/validation/conversation";

/**
 * Entry point for the n8n Messenger automation (see n8n/workflows/ and
 * docs/decisions/0008-n8n-webhook-contract.md). This route's path and
 * request body field names are an external contract the n8n workflow
 * hardcodes — both are kept unchanged by the Founder OS rebrand (see
 * docs/decisions/0013-founder-os-rebrand-route-map.md), even though the
 * customer this creates is now a Core Contact.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const secret = request.headers.get("x-n8n-webhook-secret");
  if (!env.N8N_WEBHOOK_SECRET || secret !== env.N8N_WEBHOOK_SECRET) {
    throw new UnauthorizedError("Invalid or missing webhook secret");
  }

  const body = ingestWebhookConversationSchema.parse(await request.json());
  const contact = await contactRepository.upsertByMessengerThreadId({
    messengerThreadId: body.messengerThreadId,
    name: body.customerName,
    facebookProfileUrl: body.facebookProfileUrl,
  });

  const result = await ingestConversation({
    contactId: contact.id,
    rawText: body.rawText,
    source: "messenger",
    occurredAt: body.occurredAt,
  });

  return NextResponse.json({ contactId: contact.id, ...result }, { status: 201 });
});
