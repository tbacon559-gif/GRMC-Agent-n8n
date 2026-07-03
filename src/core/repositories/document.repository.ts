import { prisma } from "@/lib/db/prisma";
import type { ModuleId } from "@/core/constants/enums";

export interface CreateDocumentInput {
  title: string;
  url?: string;
  module?: ModuleId;
  contactId?: string;
}

export const documentRepository = {
  async list(query: { module?: ModuleId; contactId?: string } = {}) {
    return prisma.document.findMany({
      where: query,
      orderBy: { createdAt: "desc" },
    });
  },

  async listByContact(contactId: string) {
    return prisma.document.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(input: CreateDocumentInput) {
    return prisma.document.create({ data: input });
  },
};
