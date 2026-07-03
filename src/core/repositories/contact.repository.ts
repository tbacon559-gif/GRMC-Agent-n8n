import type { Contact } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateContactInput, ListContactsQuery, UpdateContactInput } from "@/core/validation/contact";
import { tagRepository } from "@/core/repositories/tag.repository";

/**
 * Only Core-owned relations are included here (tags, notes, tasks,
 * memory) — never a module's extension tables (e.g. MarketplaceProfile).
 * Module-specific contact detail is composed separately via each
 * registered module's `getContactSummary()` hook (or, for a full-depth
 * module like Marketplace, its own repository queried directly by the
 * page). See docs/decisions/0012-core-module-schema-boundary.md.
 */
const contactWithCoreDetails = {
  include: {
    tags: { include: { tag: true } },
    notes: { orderBy: { createdAt: "desc" } as const },
    tasks: { orderBy: { dueAt: "asc" } as const },
    memoryEntries: { orderBy: { createdAt: "desc" } as const },
  },
} as const;

export type ContactWithCoreDetails = NonNullable<
  Awaited<ReturnType<typeof contactRepository.findById>>
>;

export const contactRepository = {
  async list(query: ListContactsQuery = {}) {
    const { search, tag, take = 50, skip = 0 } = query;
    return prisma.contact.findMany({
      where: {
        tags: tag ? { some: { tag: { name: tag } } } : undefined,
        OR: search
          ? [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    });
  },

  async count(query: ListContactsQuery = {}) {
    const { search, tag } = query;
    return prisma.contact.count({
      where: {
        tags: tag ? { some: { tag: { name: tag } } } : undefined,
        OR: search
          ? [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
    });
  },

  async findById(id: string) {
    return prisma.contact.findUnique({ where: { id }, ...contactWithCoreDetails });
  },

  async getByIdOrThrow(id: string) {
    const contact = await this.findById(id);
    if (!contact) throw new NotFoundError("Contact", id);
    return contact;
  },

  async findByMessengerThreadId(messengerThreadId: string) {
    return prisma.contact.findUnique({ where: { messengerThreadId } });
  },

  async create(input: CreateContactInput): Promise<Contact> {
    const { tags, facebookProfileUrl, email, ...rest } = input;
    const contact = await prisma.contact.create({
      data: {
        ...rest,
        facebookProfileUrl: facebookProfileUrl || null,
        email: email || null,
        customFields: {},
      },
    });
    if (tags?.length) {
      await tagRepository.attachToContact(contact.id, tags);
    }
    return contact;
  },

  /** Used by module webhooks (e.g. the Marketplace n8n integration): find-or-create a contact by Messenger thread. */
  async upsertByMessengerThreadId(params: {
    messengerThreadId: string;
    name: string;
    facebookProfileUrl?: string;
  }): Promise<Contact> {
    const existing = await this.findByMessengerThreadId(params.messengerThreadId);
    if (existing) return existing;
    return prisma.contact.create({
      data: {
        messengerThreadId: params.messengerThreadId,
        name: params.name,
        facebookProfileUrl: params.facebookProfileUrl || null,
        customFields: {},
      },
    });
  },

  async update(id: string, input: UpdateContactInput): Promise<Contact> {
    const { tags, facebookProfileUrl, email, ...rest } = input;
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...rest,
        facebookProfileUrl: facebookProfileUrl === "" ? null : facebookProfileUrl,
        email: email === "" ? null : email,
      },
    });
    if (tags) {
      await tagRepository.replaceContactTags(id, tags);
    }
    return contact;
  },

  async touchLastContact(contactId: string, at: Date): Promise<void> {
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastContactAt: at },
    });
  },

  async updateAiSummaryCache(contactId: string, summary: string): Promise<void> {
    await prisma.contact.update({ where: { id: contactId }, data: { aiSummaryCache: summary } });
  },

  async addNote(contactId: string, body: string) {
    await this.getByIdOrThrow(contactId);
    return prisma.note.create({ data: { contactId, body } });
  },

  async delete(id: string): Promise<void> {
    await prisma.contact.delete({ where: { id } });
  },
};
