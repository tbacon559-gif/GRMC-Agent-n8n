import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { contactRepository } from "@/core/repositories/contact.repository";
import { marketplaceCategoryRepository } from "@/modules/marketplace/repositories/marketplace-category.repository";
import { marketplaceInterestRepository } from "@/modules/marketplace/repositories/marketplace-interest.repository";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { marketplaceMatchRepository } from "@/modules/marketplace/repositories/marketplace-match.repository";
import { findMatchesForInventoryItem } from "@/modules/marketplace/services/matching.service";

/**
 * Exercises the repository + matching engine layers against a real SQLite
 * database (see vitest.global-setup.ts) instead of mocks, so we catch
 * issues pure unit tests can't — Prisma query shape mistakes, SQLite
 * feature gaps (no JSON filtering, no enums, no skipDuplicates), etc.
 *
 * This file and the other `*.integration.test.ts` files share one SQLite
 * file (`prisma/test.db`). SQLite only allows one writer at a time, so
 * `fileParallelism: false` in vitest.config.ts keeps these test files from
 * running concurrently and hitting SQLITE_BUSY.
 */
describe("matching engine (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("finds and ranks contacts with an open interest matching new inventory", async () => {
    const category = await marketplaceCategoryRepository.findOrCreateByName(`Kitchen Appliances ${Date.now()}`);

    const interestedContact = await contactRepository.create({ name: "Integration Test Buyer" });

    const unrelatedContact = await contactRepository.create({ name: "Integration Test Bystander" });

    await marketplaceInterestRepository.create({
      contactId: interestedContact.id,
      categoryId: category.id,
      itemDescription: "stand mixer",
      keywords: ["kitchenaid", "stand mixer"],
    });
    await marketplaceInterestRepository.create({
      contactId: unrelatedContact.id,
      categoryId: null,
      itemDescription: "patio set",
      keywords: ["patio set", "outdoor furniture"],
    });

    const item = await marketplaceItemRepository.create({
      title: "KitchenAid Stand Mixer",
      category: category.name,
      keywords: ["kitchenaid", "stand mixer"],
    });

    const matches = await findMatchesForInventoryItem(item.id);

    expect(matches.map((m) => m.contact.id)).toContain(interestedContact.id);
    expect(matches.map((m) => m.contact.id)).not.toContain(unrelatedContact.id);
    expect(matches[0].contact.id).toBe(interestedContact.id);

    const persisted = await marketplaceMatchRepository.listForItem(item.id);
    expect(persisted).toHaveLength(matches.length);
    expect(persisted[0].score).toBe(matches[0].score);
  });

  it("does not duplicate suggestions when the matching engine reruns for the same item", async () => {
    const category = await marketplaceCategoryRepository.findOrCreateByName(`Furniture ${Date.now()}`);
    const contact = await contactRepository.create({ name: "Rerun Test Contact" });
    await marketplaceInterestRepository.create({
      contactId: contact.id,
      categoryId: category.id,
      itemDescription: "sofa",
      keywords: ["sofa", "couch"],
    });
    const item = await marketplaceItemRepository.create({
      title: "Mid-century sofa",
      category: category.name,
      keywords: ["sofa", "couch"],
    });

    await findMatchesForInventoryItem(item.id);
    await findMatchesForInventoryItem(item.id);

    const persisted = await marketplaceMatchRepository.listForItem(item.id);
    expect(persisted).toHaveLength(1);
  });
});
