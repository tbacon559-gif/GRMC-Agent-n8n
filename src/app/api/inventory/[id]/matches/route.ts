import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { matchRepository } from "@/lib/repositories/match.repository";
import { findMatchesForInventoryItem } from "@/lib/services/matching.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const matches = await matchRepository.listForInventoryItem(id);
  return NextResponse.json({ matches });
});

/** Recomputes matches — useful after new interests come in for existing inventory. */
export const POST = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const matches = await findMatchesForInventoryItem(id);
  return NextResponse.json({ matches });
});
