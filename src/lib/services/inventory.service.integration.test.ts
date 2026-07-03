import { afterAll, describe, expect, it } from "vitest";
import type { InventoryItem } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { recordInventorySale, withProfit } from "@/lib/services/inventory.service";

function partialItem(overrides: Partial<InventoryItem>): InventoryItem {
  return overrides as InventoryItem;
}

describe("inventory.service (integration)", () => {
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

  describe("recordInventorySale", () => {
    it("marks the item sold and updates the buyer's purchase stats and last contact", async () => {
      const buyer = await customerRepository.create({ name: "Sale Test Buyer" });
      const item = await inventoryRepository.create({
        title: "Sale Test Item",
        acquisitionCostCents: 2000,
      });

      const sold = await recordInventorySale(item.id, { buyerId: buyer.id, salePriceCents: 6000 });

      expect(sold.status).toBe("sold");
      expect(sold.buyerId).toBe(buyer.id);
      expect(sold.salePriceCents).toBe(6000);
      expect(withProfit(sold).profitCents).toBe(4000);

      const updatedBuyer = await customerRepository.findById(buyer.id);
      expect(updatedBuyer!.totalPurchases).toBe(1);
      expect(updatedBuyer!.lifetimeSpendCents).toBe(6000);
      expect(updatedBuyer!.status).toBe("buyer");
      expect(updatedBuyer!.lastContactAt).not.toBeNull();
    });

    it("accumulates purchases and spend across multiple sales to the same buyer", async () => {
      const buyer = await customerRepository.create({ name: "Repeat Sale Test Buyer" });
      const itemA = await inventoryRepository.create({ title: "Repeat Sale Item A" });
      const itemB = await inventoryRepository.create({ title: "Repeat Sale Item B" });

      await recordInventorySale(itemA.id, { buyerId: buyer.id, salePriceCents: 3000 });
      await recordInventorySale(itemB.id, { buyerId: buyer.id, salePriceCents: 5000 });

      const updatedBuyer = await customerRepository.findById(buyer.id);
      expect(updatedBuyer!.totalPurchases).toBe(2);
      expect(updatedBuyer!.lifetimeSpendCents).toBe(8000);
    });
  });
});
