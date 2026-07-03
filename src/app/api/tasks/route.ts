import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { taskRepository } from "@/core/repositories/task.repository";
import { createTaskSchema, listTasksQuerySchema } from "@/core/validation/task";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = listTasksQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const tasks = await taskRepository.list(query);
  return NextResponse.json({ tasks });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = createTaskSchema.parse(await request.json());
  const task = await taskRepository.create(body);
  return NextResponse.json({ task }, { status: 201 });
});
