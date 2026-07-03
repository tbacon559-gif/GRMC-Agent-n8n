import { prisma } from "@/lib/db/prisma";
import type { ReminderStatus } from "@/lib/constants/enums";

export interface CreateReminderInput {
  customerId: string;
  conversationId?: string;
  dueAt: Date;
  note: string;
}

export const reminderRepository = {
  async create(input: CreateReminderInput) {
    return prisma.followUpReminder.create({
      data: {
        customerId: input.customerId,
        conversationId: input.conversationId,
        dueAt: input.dueAt,
        note: input.note,
      },
    });
  },

  async listDue(now: Date = new Date(), take = 20) {
    return prisma.followUpReminder.findMany({
      where: { status: "pending", dueAt: { lte: now } },
      include: { customer: true },
      orderBy: { dueAt: "asc" },
      take,
    });
  },

  async listUpcoming(take = 20) {
    return prisma.followUpReminder.findMany({
      where: { status: "pending" },
      include: { customer: true },
      orderBy: { dueAt: "asc" },
      take,
    });
  },

  async updateStatus(id: string, status: ReminderStatus) {
    return prisma.followUpReminder.update({ where: { id }, data: { status } });
  },
};
