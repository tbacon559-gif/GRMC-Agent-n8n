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
  async attachToContact(contactId: string, names: string[]): Promise<void> {
    const tags = await this.findOrCreateManyByNames(names);
    await Promise.all(
      tags.map((tag) =>
        prisma.contactTag.upsert({
          where: { contactId_tagId: { contactId, tagId: tag.id } },
          create: { contactId, tagId: tag.id },
          update: {},
        }),
      ),
    );
  },

  /** Replaces the full tag set on a contact with `names`. */
  async replaceContactTags(contactId: string, names: string[]): Promise<void> {
    await prisma.contactTag.deleteMany({ where: { contactId } });
    if (names.length) {
      await this.attachToContact(contactId, names);
    }
  },
};
