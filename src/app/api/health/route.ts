import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { hasAnthropicApiKey } from "@/lib/env";

/** Liveness/readiness check: confirms the database is reachable, independent of any specific feature. */
export const GET = withErrorHandling(async () => {
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ status: "ok", aiEnabled: hasAnthropicApiKey });
});
