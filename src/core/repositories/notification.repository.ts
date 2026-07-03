import { prisma } from "@/lib/db/prisma";
import type { ModuleId } from "@/core/constants/enums";

export interface CreateNotificationInput {
  message: string;
  module?: ModuleId;
  contactId?: string;
}

export const notificationRepository = {
  async listUnread(take = 20) {
    return prisma.notification.findMany({
      where: { readAt: null },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async create(input: CreateNotificationInput) {
    return prisma.notification.create({ data: input });
  },

  async markRead(id: string): Promise<void> {
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  },
};
