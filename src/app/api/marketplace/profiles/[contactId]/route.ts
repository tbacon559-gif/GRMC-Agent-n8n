import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { marketplaceProfileRepository } from "@/modules/marketplace/repositories/marketplace-profile.repository";
import { updateMarketplaceProfileSchema } from "@/modules/marketplace/validation/profile";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { contactId } = await params;
  const body = updateMarketplaceProfileSchema.parse(await request.json());
  const profile = await marketplaceProfileRepository.updateStatus(contactId, body.status);
  return NextResponse.json({ profile });
});
