import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { env } from "@/lib/env";
import { UnauthorizedError } from "@/lib/errors";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { ingestConversation } from "@/lib/services/conversation.service";
import { ingestWebhookConversationSchema } from "@/lib/validation/conversation";

/**
 * Entry point for the n8n Messenger automation (see n8n/workflows/ and
 * docs/decisions/0008-n8n-webhook-contract.md). Unlike POST /api/conversations,
 * this identifies (or creates) the customer by Messenger thread ID, since
 * n8n is often forwarding a brand-new contact the CRM has never seen.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const secret = request.headers.get("x-n8n-webhook-secret");
  if (!env.N8N_WEBHOOK_SECRET || secret !== env.N8N_WEBHOOK_SECRET) {
    throw new UnauthorizedError("Invalid or missing webhook secret");
  }

  const body = ingestWebhookConversationSchema.parse(await request.json());
  const customer = await customerRepository.upsertByMessengerThreadId({
    messengerThreadId: body.messengerThreadId,
    name: body.customerName,
    facebookProfileUrl: body.facebookProfileUrl,
  });

  const result = await ingestConversation({
    customerId: customer.id,
    rawText: body.rawText,
    source: "messenger",
    occurredAt: body.occurredAt,
  });

  return NextResponse.json({ customerId: customer.id, ...result }, { status: 201 });
});
