import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export const marketplaceConversationRepository = {
  async create(data: Prisma.MarketplaceConversationCreateInput) {
    return prisma.marketplaceConversation.create({ data });
  },

  async listByContact(contactId: string, take = 50) {
    return prisma.marketplaceConversation.findMany({
      where: { contactId },
      orderBy: { occurredAt: "desc" },
      take,
    });
  },

  async listRecent(take = 10) {
    return prisma.marketplaceConversation.findMany({
      include: { contact: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async findById(id: string) {
    return prisma.marketplaceConversation.findUnique({ where: { id } });
  },
};
