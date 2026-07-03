import { prisma } from "@/lib/db/prisma";

export interface CreatePublishingProjectInput {
  title: string;
  contactId?: string;
  status?: string;
  platform?: string;
  publishedAt?: Date;
}

export const publishingProjectRepository = {
  async list() {
    return prisma.publishingProject.findMany({ orderBy: { createdAt: "desc" } });
  },

  async listByContact(contactId: string) {
    return prisma.publishingProject.findMany({ where: { contactId }, orderBy: { createdAt: "desc" } });
  },

  async create(input: CreatePublishingProjectInput) {
    return prisma.publishingProject.create({ data: input });
  },
};
