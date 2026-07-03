import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandling } from "@/lib/api/handler";
import { REMINDER_STATUSES } from "@/lib/constants/enums";
import { reminderRepository } from "@/lib/repositories/reminder.repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateReminderSchema = z.object({ status: z.enum(REMINDER_STATUSES) });

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = updateReminderSchema.parse(await request.json());
  const reminder = await reminderRepository.updateStatus(id, body.status);
  return NextResponse.json({ reminder });
});
