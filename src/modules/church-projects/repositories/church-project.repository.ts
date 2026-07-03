import { prisma } from "@/lib/db/prisma";

export interface CreateChurchProjectInput {
  title: string;
  contactId?: string;
  status?: string;
  dueAt?: Date;
  notes?: string;
}

export const churchProjectRepository = {
  async list() {
    return prisma.churchProject.findMany({ orderBy: { createdAt: "desc" } });
  },

  async listByContact(contactId: string) {
    return prisma.churchProject.findMany({ where: { contactId }, orderBy: { createdAt: "desc" } });
  },

  async create(input: CreateChurchProjectInput) {
    return prisma.churchProject.create({ data: input });
  },
};
