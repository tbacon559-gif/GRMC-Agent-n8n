import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { getFinanceSummary } from "@/core/services/finance.service";

export const GET = withErrorHandling(async () => {
  const summary = await getFinanceSummary();
  return NextResponse.json(summary);
});
