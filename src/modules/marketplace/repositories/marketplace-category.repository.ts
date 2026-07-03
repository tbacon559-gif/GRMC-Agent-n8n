import { prisma } from "@/lib/db/prisma";

function normalize(name: string): string {
  return name.trim();
}

export const marketplaceCategoryRepository = {
  async list() {
    return prisma.marketplaceCategory.findMany({ orderBy: { name: "asc" } });
  },

  async findByName(name: string) {
    return prisma.marketplaceCategory.findUnique({ where: { name: normalize(name) } });
  },

  async findOrCreateByName(name: string) {
    const normalized = normalize(name);
    return prisma.marketplaceCategory.upsert({
      where: { name: normalized },
      create: { name: normalized },
      update: {},
    });
  },
};
