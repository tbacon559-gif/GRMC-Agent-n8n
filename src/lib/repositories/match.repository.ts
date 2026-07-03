import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { MatchStatus } from "@/lib/constants/enums";

export interface MatchSuggestionInput {
  inventoryItemId: string;
  customerId: string;
  score: number;
  breakdown: Prisma.InputJsonValue;
}

export const matchRepository = {
  /** Upserts so re-running the matching engine for the same item updates scores rather than duplicating rows. */
  async upsertMany(matches: MatchSuggestionInput[]) {
    return Promise.all(
      matches.map((match) =>
        prisma.matchSuggestion.upsert({
          where: {
            inventoryItemId_customerId: {
              inventoryItemId: match.inventoryItemId,
              customerId: match.customerId,
            },
          },
          create: {
            inventoryItemId: match.inventoryItemId,
            customerId: match.customerId,
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

  async listForInventoryItem(inventoryItemId: string) {
    return prisma.matchSuggestion.findMany({
      where: { inventoryItemId },
      include: { customer: true },
      orderBy: { score: "desc" },
    });
  },

  async listTopSuggested(take = 10) {
    return prisma.matchSuggestion.findMany({
      where: { status: "suggested" },
      include: { customer: true, inventoryItem: true },
      orderBy: { score: "desc" },
      take,
    });
  },

  async updateStatus(id: string, status: MatchStatus) {
    return prisma.matchSuggestion.update({ where: { id }, data: { status } });
  },
};
