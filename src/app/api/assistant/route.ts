import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { answerAssistantQuestion } from "@/core/ai/assistant";
import { assistantQuerySchema } from "@/core/validation/assistant";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = assistantQuerySchema.parse(await request.json());
  const result = await answerAssistantQuestion(body.question);
  return NextResponse.json(result);
});
