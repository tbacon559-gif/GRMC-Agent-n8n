import { z } from "zod";
import { MODULE_IDS, TASK_PRIORITIES, TASK_STATUSES } from "@/core/constants/enums";

export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
export const moduleIdSchema = z.enum(MODULE_IDS);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  notes: z.string().trim().optional(),
  dueAt: z.coerce.date().optional(),
  priority: taskPrioritySchema.optional(),
  module: moduleIdSchema.optional(),
  contactId: z.string().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  notes: z.string().trim().optional(),
  dueAt: z.coerce.date().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const listTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  module: moduleIdSchema.optional(),
  contactId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
