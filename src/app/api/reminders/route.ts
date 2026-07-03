import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { reminderRepository } from "@/lib/repositories/reminder.repository";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const due = request.nextUrl.searchParams.get("due");
  const reminders =
    due === "true" ? await reminderRepository.listDue() : await reminderRepository.listUpcoming();
  return NextResponse.json({ reminders });
});
