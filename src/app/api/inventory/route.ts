import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { createInventoryItem, withProfit } from "@/lib/services/inventory.service";
import { createInventoryItemSchema, listInventoryQuerySchema } from "@/lib/validation/inventory";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = listInventoryQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const [items, total] = await Promise.all([
    inventoryRepository.list(query),
    inventoryRepository.count(query),
  ]);
  return NextResponse.json({ items: items.map(withProfit), total });
});

/**
 * Creating inventory immediately runs the matching engine and returns who
 * to contact before listing publicly — the core "matching engine" spec
 * requirement.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = createInventoryItemSchema.parse(await request.json());
  const { item, matches } = await createInventoryItem(body);
  return NextResponse.json({ item: withProfit(item), matches }, { status: 201 });
});
