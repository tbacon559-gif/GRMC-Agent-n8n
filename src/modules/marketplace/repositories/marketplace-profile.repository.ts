import { prisma } from "@/lib/db/prisma";
import type { MarketplaceProfileStatus } from "@/modules/marketplace/constants/enums";

export const marketplaceProfileRepository = {
  async findByContactId(contactId: string) {
    return prisma.marketplaceProfile.findUnique({ where: { contactId } });
  },

  /** Every Marketplace-facing contact needs a profile row — created lazily on first Marketplace interaction. */
  async getOrCreate(contactId: string) {
    return prisma.marketplaceProfile.upsert({
      where: { contactId },
      create: { contactId },
      update: {},
    });
  },

  async updateStatus(contactId: string, status: MarketplaceProfileStatus) {
    return prisma.marketplaceProfile.upsert({
      where: { contactId },
      create: { contactId, status },
      update: { status },
    });
  },

  async updateScores(
    contactId: string,
    scores: { reliabilityScore?: number; responsivenessScore?: number },
  ) {
    return prisma.marketplaceProfile.upsert({
      where: { contactId },
      create: { contactId, ...scores },
      update: scores,
    });
  },
};
