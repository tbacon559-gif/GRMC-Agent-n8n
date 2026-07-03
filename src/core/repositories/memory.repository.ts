import { prisma } from "@/lib/db/prisma";
import type { MemoryKind, ModuleId } from "@/core/constants/enums";

export interface CreateMemoryEntryInput {
  contactId: string;
  module?: ModuleId;
  kind: MemoryKind;
  content: string;
  sourceType?: string;
  sourceId?: string;
}

/**
 * Append-only. There is deliberately no `update` or `delete` here — see
 * docs/decisions/0009-ai-memory-append-only-log.md. A fact once recorded is
 * never overwritten; corrections are recorded as new entries.
 */
export const memoryRepository = {
  async create(input: CreateMemoryEntryInput) {
    return prisma.contactMemoryEntry.create({ data: input });
  },

  async listByContact(contactId: string) {
    return prisma.contactMemoryEntry.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
    });
  },
};
