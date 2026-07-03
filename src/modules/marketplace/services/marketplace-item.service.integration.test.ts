import { afterAll, describe, expect, it } from "vitest";
import type { MarketplaceItem } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { contactRepository } from "@/core/repositories/contact.repository";
import { financeRepository } from "@/core/repositories/finance.repository";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { marketplaceProfileRepository } from "@/modules/marketplace/repositories/marketplace-profile.repository";
import { recordMarketplaceSale, withProfit } from "@/modules/marketplace/services/marketplace-item.service";

function partialItem(overrides: Partial<MarketplaceItem>): MarketplaceItem {
  return overrides as MarketplaceItem;
}

describe("marketplace-item.service (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("withProfit", () => {
    it("computes profit from sale minus acquisition cost", () => {
      const item = partialItem({ acquisitionCostCents: 4000, salePriceCents: 9000 });
      expect(withProfit(item).profitCents).toBe(5000);
    });

    it("is null when the item hasn't sold yet", () => {
      const item = partialItem({ acquisitionCostCents: 4000, salePriceCents: null });
      expect(withProfit(item).profitCents).toBeNull();
    });

    it("is null when acquisition cost was never recorded", () => {
      const item = partialItem({ acquisitionCostCents: null, salePriceCents: 9000 });
      expect(withProfit(item).profitCents).toBeNull();
    });
  });

  describe("recordMarketplaceSale", () => {
    it("marks the item sold, records income on the Finance ledger, and updates the buyer's profile and last contact", async () => {
      const buyer = await contactRepository.create({ name: "Sale Test Buyer" });
      const item = await marketplaceItemRepository.create({
        title: "Sale Test Item",
        acquisitionCostCents: 2000,
      });

      const sold = await recordMarketplaceSale(item.id, { contactId: buyer.id, salePriceCents: 6000 });

      expect(sold.status).toBe("sold");
      expect(sold.contactId).toBe(buyer.id);
      expect(sold.salePriceCents).toBe(6000);
      expect(withProfit(sold).profitCents).toBe(4000);

      const transactions = await financeRepository.listByContact(buyer.id);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({ type: "income", amountCents: 6000, module: "marketplace" });

      const profile = await marketplaceProfileRepository.findByContactId(buyer.id);
      expect(profile?.status).toBe("buyer");

      const updatedBuyer = await contactRepository.findById(buyer.id);
      expect(updatedBuyer!.lastContactAt).not.toBeNull();
    });

    it("accumulates separate Finance transactions across multiple sales to the same buyer", async () => {
      const buyer = await contactRepository.create({ name: "Repeat Sale Test Buyer" });
      const itemA = await marketplaceItemRepository.create({ title: "Repeat Sale Item A" });
      const itemB = await marketplaceItemRepository.create({ title: "Repeat Sale Item B" });

      await recordMarketplaceSale(itemA.id, { contactId: buyer.id, salePriceCents: 3000 });
      await recordMarketplaceSale(itemB.id, { contactId: buyer.id, salePriceCents: 5000 });

      const transactions = await financeRepository.listByContact(buyer.id);
      expect(transactions).toHaveLength(2);
      expect(transactions.reduce((sum, tx) => sum + tx.amountCents, 0)).toBe(8000);
    });
  });
});
