import { prisma } from "@/lib/db/prisma";

export interface CreateGameStudioProjectInput {
  title: string;
  contactId?: string;
  status?: string;
  notes?: string;
}

export const gameStudioProjectRepository = {
  async list() {
    return prisma.gameStudioProject.findMany({ orderBy: { createdAt: "desc" } });
  },

  async listByContact(contactId: string) {
    return prisma.gameStudioProject.findMany({ where: { contactId }, orderBy: { createdAt: "desc" } });
  },

  async create(input: CreateGameStudioProjectInput) {
    return prisma.gameStudioProject.create({ data: input });
  },
};
