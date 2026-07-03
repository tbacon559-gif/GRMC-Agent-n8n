import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { tagRepository } from "@/lib/repositories/tag.repository";

export const GET = withErrorHandling(async () => {
  const tags = await tagRepository.list();
  return NextResponse.json({ tags });
});
