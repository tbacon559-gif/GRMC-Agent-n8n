import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { withProfit } from "@/lib/services/inventory.service";
import { updateInventoryItemSchema } from "@/lib/validation/inventory";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const item = await inventoryRepository.getByIdOrThrow(id);
  return NextResponse.json({ item: withProfit(item) });
});

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = updateInventoryItemSchema.parse(await request.json());
  const item = await inventoryRepository.update(id, body);
  return NextResponse.json({ item: withProfit(item) });
});

export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  await inventoryRepository.delete(id);
  return NextResponse.json({ success: true });
});
