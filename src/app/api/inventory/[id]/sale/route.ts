import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { recordInventorySale, withProfit } from "@/lib/services/inventory.service";
import { recordSaleSchema } from "@/lib/validation/inventory";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = recordSaleSchema.parse(await request.json());
  const item = await recordInventorySale(id, body);
  return NextResponse.json({ item: withProfit(item) });
});
