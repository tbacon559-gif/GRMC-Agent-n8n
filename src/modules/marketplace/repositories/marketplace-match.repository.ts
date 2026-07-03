import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { MatchStatus } from "@/modules/marketplace/constants/enums";

export interface MarketplaceMatchInput {
  marketplaceItemId: string;
  contactId: string;
  score: number;
  breakdown: Prisma.InputJsonValue;
}

export const marketplaceMatchRepository = {
  /** Upserts so re-running the matching engine for the same item updates scores rather than duplicating rows. */
  async upsertMany(matches: MarketplaceMatchInput[]) {
    return Promise.all(
      matches.map((match) =>
        prisma.marketplaceMatch.upsert({
          where: {
            marketplaceItemId_contactId: {
              marketplaceItemId: match.marketplaceItemId,
              contactId: match.contactId,
            },
          },
          create: {
            marketplaceItemId: match.marketplaceItemId,
            contactId: match.contactId,
            score: match.score,
            breakdown: match.breakdown,
          },
          update: {
            score: match.score,
            breakdown: match.breakdown,
            status: "suggested",
          },
        }),
      ),
    );
  },

  async listForItem(marketplaceItemId: string) {
    return prisma.marketplaceMatch.findMany({
      where: { marketplaceItemId },
      include: { contact: true },
      orderBy: { score: "desc" },
    });
  },

  async listTopSuggested(take = 10) {
    return prisma.marketplaceMatch.findMany({
      where: { status: "suggested" },
      include: { contact: true, item: true },
      orderBy: { score: "desc" },
      take,
    });
  },

  async updateStatus(id: string, status: MatchStatus) {
    return prisma.marketplaceMatch.update({ where: { id }, data: { status } });
  },
};
