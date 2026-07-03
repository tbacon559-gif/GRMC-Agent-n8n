import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { marketplaceCategoryRepository } from "@/modules/marketplace/repositories/marketplace-category.repository";

export const GET = withErrorHandling(async () => {
  const categories = await marketplaceCategoryRepository.list();
  return NextResponse.json({ categories });
});
