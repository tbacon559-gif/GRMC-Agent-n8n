import { prisma } from "@/lib/db/prisma";

function normalize(name: string): string {
  return name.trim();
}

export const categoryRepository = {
  async list() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },

  async findByName(name: string) {
    return prisma.category.findUnique({ where: { name: normalize(name) } });
  },

  async findOrCreateByName(name: string) {
    const normalized = normalize(name);
    return prisma.category.upsert({
      where: { name: normalized },
      create: { name: normalized },
      update: {},
    });
  },
};
