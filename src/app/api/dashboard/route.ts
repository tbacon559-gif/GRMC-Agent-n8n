import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { getDashboardData } from "@/core/services/dashboard.service";

export const GET = withErrorHandling(async () => {
  const data = await getDashboardData();
  return NextResponse.json(data);
});
