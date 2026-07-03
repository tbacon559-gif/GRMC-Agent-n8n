import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { recordMarketplaceSale, withProfit } from "@/modules/marketplace/services/marketplace-item.service";
import { recordSaleSchema } from "@/modules/marketplace/validation/inventory";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = recordSaleSchema.parse(await request.json());
  const item = await recordMarketplaceSale(id, body);
  return NextResponse.json({ item: withProfit(item) });
});
