import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { ingestConversation } from "@/modules/marketplace/services/marketplace-conversation.service";
import { ingestConversationSchema } from "@/modules/marketplace/validation/conversation";

/** Ingests a conversation excerpt for an existing contact and runs the AI extraction pipeline. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = ingestConversationSchema.parse(await request.json());
  const result = await ingestConversation(body);
  return NextResponse.json(result, { status: 201 });
});
