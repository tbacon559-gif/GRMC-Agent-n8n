import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export const conversationRepository = {
  async create(data: Prisma.ConversationCreateInput) {
    return prisma.conversation.create({ data });
  },

  async listByCustomer(customerId: string, take = 50) {
    return prisma.conversation.findMany({
      where: { customerId },
      orderBy: { occurredAt: "desc" },
      take,
    });
  },

  async listRecent(take = 10) {
    return prisma.conversation.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async findById(id: string) {
    return prisma.conversation.findUnique({ where: { id } });
  },
};
