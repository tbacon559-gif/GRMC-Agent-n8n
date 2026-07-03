import { prisma } from "@/lib/db/prisma";

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export const tagRepository = {
  async list() {
    return prisma.tag.findMany({ orderBy: { name: "asc" } });
  },

  async findOrCreateManyByNames(names: string[]) {
    const unique = [...new Set(names.map(normalize))].filter(Boolean);
    return Promise.all(
      unique.map((name) =>
        prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
      ),
    );
  },

  /**
   * `createMany({ skipDuplicates: true })` would be simpler, but
   * `skipDuplicates` isn't supported on SQLite (only Postgres/MySQL/
   * CockroachDB) — so duplicates are skipped one row at a time via upsert
   * on the composite key instead.
   */
  async attachToCustomer(customerId: string, names: string[]): Promise<void> {
    const tags = await this.findOrCreateManyByNames(names);
    await Promise.all(
      tags.map((tag) =>
        prisma.customerTag.upsert({
          where: { customerId_tagId: { customerId, tagId: tag.id } },
          create: { customerId, tagId: tag.id },
          update: {},
        }),
      ),
    );
  },

  /** Replaces the full tag set on a customer with `names`. */
  async replaceCustomerTags(customerId: string, names: string[]): Promise<void> {
    await prisma.customerTag.deleteMany({ where: { customerId } });
    if (names.length) {
      await this.attachToCustomer(customerId, names);
    }
  },
};
