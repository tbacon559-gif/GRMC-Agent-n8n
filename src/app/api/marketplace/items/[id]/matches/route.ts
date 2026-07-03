import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { marketplaceMatchRepository } from "@/modules/marketplace/repositories/marketplace-match.repository";
import { findMatchesForInventoryItem } from "@/modules/marketplace/services/matching.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const matches = await marketplaceMatchRepository.listForItem(id);
  return NextResponse.json({ matches });
});

/** Recomputes matches — useful after new interests come in for existing inventory. */
export const POST = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const matches = await findMatchesForInventoryItem(id);
  return NextResponse.json({ matches });
});
