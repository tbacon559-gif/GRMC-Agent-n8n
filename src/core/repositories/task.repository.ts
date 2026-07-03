import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "@/core/validation/task";

export const taskRepository = {
  async list(query: ListTasksQuery = {}) {
    const { status, module, contactId, take = 50, skip = 0 } = query;
    return prisma.task.findMany({
      where: { status, module, contactId },
      include: { contact: true },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take,
      skip,
    });
  },

  /** Tasks due now or overdue, across every module and contact — the dashboard/briefing "what's due" feed. */
  async listDue(now: Date = new Date(), take = 20) {
    return prisma.task.findMany({
      where: { status: "pending", dueAt: { lte: now } },
      include: { contact: true },
      orderBy: { dueAt: "asc" },
      take,
    });
  },

  async listUpcoming(take = 20) {
    return prisma.task.findMany({
      where: { status: "pending" },
      include: { contact: true },
      orderBy: { dueAt: "asc" },
      take,
    });
  },

  async findById(id: string) {
    return prisma.task.findUnique({ where: { id }, include: { contact: true } });
  },

  async getByIdOrThrow(id: string) {
    const task = await this.findById(id);
    if (!task) throw new NotFoundError("Task", id);
    return task;
  },

  async create(input: CreateTaskInput) {
    return prisma.task.create({ data: input });
  },

  async update(id: string, input: UpdateTaskInput) {
    const data = { ...input } as typeof input & { completedAt?: Date | null };
    if (input.status === "done" || input.status === "dismissed") {
      data.completedAt = new Date();
    }
    return prisma.task.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  },
};
