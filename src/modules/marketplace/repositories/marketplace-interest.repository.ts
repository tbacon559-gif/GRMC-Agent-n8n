import { prisma } from "@/lib/db/prisma";

export interface CreateMarketplaceInterestInput {
  contactId: string;
  conversationId?: string;
  categoryId?: string | null;
  itemDescription: string;
  keywords: string[];
  budgetCents?: number | null;
}

/**
 * Candidates are fetched with `contact.marketplaceProfile` included so the
 * matching engine can read reliability/responsiveness — those scores live
 * on the module-specific MarketplaceProfile, not on the universal Contact.
 */
const withScoringRelations = {
  include: { contact: { include: { marketplaceProfile: true } }, category: true },
} as const;

export const marketplaceInterestRepository = {
  async create(input: CreateMarketplaceInterestInput) {
    return prisma.marketplaceInterest.create({
      data: {
        contactId: input.contactId,
        conversationId: input.conversationId,
        categoryId: input.categoryId ?? undefined,
        itemDescription: input.itemDescription,
        keywords: input.keywords,
        budgetCents: input.budgetCents ?? undefined,
      },
    });
  },

  /**
   * Candidate interests for the matching engine: open interests, narrowed by
   * category when the marketplace item has one. This is an indexed DB filter;
   * keyword-level similarity scoring happens in-process afterwards because
   * Prisma's JSON filtering isn't supported on SQLite. If the candidate set
   * ever gets too large to score in-process at scale, keywords should move
   * to a normalized `InterestKeyword` join table for indexed lookups — see
   * docs/decisions/0004-matching-engine-design.md.
   */
  async findOpenCandidates(categoryId: string | null) {
    return prisma.marketplaceInterest.findMany({
      where: {
        status: "open",
        OR: categoryId ? [{ categoryId }, { categoryId: null }] : undefined,
      },
      ...withScoringRelations,
    });
  },

  /**
   * All open interests, for in-process text/keyword search. Bounded at
   * 2000 rows — fine for MVP scale. If the open-interest backlog grows well
   * beyond that, this should become a proper indexed search (e.g. a
   * normalized InterestKeyword table or a full-text index) rather than an
   * in-process scan — see docs/decisions/0004-matching-engine-design.md.
   */
  async listAllOpen(take = 2000) {
    return prisma.marketplaceInterest.findMany({
      where: { status: "open" },
      include: { contact: true, category: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async listByContact(contactId: string) {
    return prisma.marketplaceInterest.findMany({
      where: { contactId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async markStatus(id: string, status: "open" | "fulfilled" | "expired") {
    return prisma.marketplaceInterest.update({ where: { id }, data: { status } });
  },
};
