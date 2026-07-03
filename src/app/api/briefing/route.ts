import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { getBriefing } from "@/core/services/briefing.service";

/** On-demand "AI Chief of Staff" morning briefing — no scheduler, called explicitly by the dashboard. */
export const POST = withErrorHandling(async () => {
  const result = await getBriefing();
  return NextResponse.json(result);
});
