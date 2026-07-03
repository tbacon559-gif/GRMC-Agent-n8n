import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { createMarketplaceItem, withProfit } from "@/modules/marketplace/services/marketplace-item.service";
import { createMarketplaceItemSchema, listMarketplaceItemsQuerySchema } from "@/modules/marketplace/validation/inventory";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = listMarketplaceItemsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const [items, total] = await Promise.all([
    marketplaceItemRepository.list(query),
    marketplaceItemRepository.count(query),
  ]);
  return NextResponse.json({ items: items.map(withProfit), total });
});

/**
 * Creating a marketplace item immediately runs the matching engine and
 * returns who to contact before listing publicly — the core "matching
 * engine" spec requirement.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = createMarketplaceItemSchema.parse(await request.json());
  const { item, matches } = await createMarketplaceItem(body);
  return NextResponse.json({ item: withProfit(item), matches }, { status: 201 });
});
