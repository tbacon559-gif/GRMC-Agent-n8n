import { prisma } from "@/lib/db/prisma";

export interface CreateLawnCareClientInput {
  contactId: string;
  propertyAddress: string;
  serviceFrequency?: string;
  nextServiceAt?: Date;
  notes?: string;
}

export const lawnCareClientRepository = {
  async list() {
    return prisma.lawnCareClient.findMany({
      include: { contact: true },
      orderBy: { nextServiceAt: "asc" },
    });
  },

  async findByContactId(contactId: string) {
    return prisma.lawnCareClient.findUnique({ where: { contactId } });
  },

  async create(input: CreateLawnCareClientInput) {
    return prisma.lawnCareClient.create({ data: input });
  },
};
