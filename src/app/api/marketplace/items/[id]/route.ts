import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { withProfit } from "@/modules/marketplace/services/marketplace-item.service";
import { updateMarketplaceItemSchema } from "@/modules/marketplace/validation/inventory";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const item = await marketplaceItemRepository.getByIdOrThrow(id);
  return NextResponse.json({ item: withProfit(item) });
});

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = updateMarketplaceItemSchema.parse(await request.json());
  const item = await marketplaceItemRepository.update(id, body);
  return NextResponse.json({ item: withProfit(item) });
});

export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  await marketplaceItemRepository.delete(id);
  return NextResponse.json({ success: true });
});
