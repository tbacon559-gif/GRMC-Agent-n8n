import { prisma } from "@/lib/db/prisma";

export const noteRepository = {
  async listByContact(contactId: string) {
    return prisma.note.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(contactId: string, body: string) {
    return prisma.note.create({ data: { contactId, body } });
  },

  async delete(id: string): Promise<void> {
    await prisma.note.delete({ where: { id } });
  },
};
