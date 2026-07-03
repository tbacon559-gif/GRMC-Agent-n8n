import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { categoryRepository } from "@/lib/repositories/category.repository";

export const GET = withErrorHandling(async () => {
  const categories = await categoryRepository.list();
  return NextResponse.json({ categories });
});
