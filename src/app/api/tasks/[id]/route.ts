import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { taskRepository } from "@/core/repositories/task.repository";
import { updateTaskSchema } from "@/core/validation/task";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = updateTaskSchema.parse(await request.json());
  const task = await taskRepository.update(id, body);
  return NextResponse.json({ task });
});

export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  await taskRepository.delete(id);
  return NextResponse.json({ success: true });
});
