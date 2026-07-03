import { prisma } from "@/lib/db/prisma";

export interface CreateAiProductProjectInput {
  name: string;
  contactId?: string;
  status?: string;
  notes?: string;
}

export const aiProductProjectRepository = {
  async list() {
    return prisma.aiProductProject.findMany({ orderBy: { createdAt: "desc" } });
  },

  async listByContact(contactId: string) {
    return prisma.aiProductProject.findMany({ where: { contactId }, orderBy: { createdAt: "desc" } });
  },

  async create(input: CreateAiProductProjectInput) {
    return prisma.aiProductProject.create({ data: input });
  },
};
