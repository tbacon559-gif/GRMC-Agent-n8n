import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { categoryRepository } from "@/lib/repositories/category.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { interestRepository } from "@/lib/repositories/interest.repository";
import { matchRepository } from "@/lib/repositories/match.repository";
import { findMatchesForInventoryItem } from "@/lib/services/matching.service";

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

  it("finds and ranks customers with an open interest matching new inventory", async () => {
    const category = await categoryRepository.findOrCreateByName(`Kitchen Appliances ${Date.now()}`);

    const interestedCustomer = await customerRepository.create({
      name: "Integration Test Buyer",
      status: "buyer",
    });
    await customerRepository.update(interestedCustomer.id, { reliabilityScore: 80 });

    const unrelatedCustomer = await customerRepository.create({
      name: "Integration Test Bystander",
      status: "prospect",
    });

    await interestRepository.create({
      customerId: interestedCustomer.id,
      categoryId: category.id,
      itemDescription: "stand mixer",
      keywords: ["kitchenaid", "stand mixer"],
    });
    await interestRepository.create({
      customerId: unrelatedCustomer.id,
      categoryId: null,
      itemDescription: "patio set",
      keywords: ["patio set", "outdoor furniture"],
    });

    const item = await inventoryRepository.create({
      title: "KitchenAid Stand Mixer",
      category: category.name,
      keywords: ["kitchenaid", "stand mixer"],
    });

    const matches = await findMatchesForInventoryItem(item.id);

    expect(matches.map((m) => m.customer.id)).toContain(interestedCustomer.id);
    expect(matches.map((m) => m.customer.id)).not.toContain(unrelatedCustomer.id);
    expect(matches[0].customer.id).toBe(interestedCustomer.id);

    const persisted = await matchRepository.listForInventoryItem(item.id);
    expect(persisted).toHaveLength(matches.length);
    expect(persisted[0].score).toBe(matches[0].score);
  });

  it("does not duplicate suggestions when the matching engine reruns for the same item", async () => {
    const category = await categoryRepository.findOrCreateByName(`Furniture ${Date.now()}`);
    const customer = await customerRepository.create({ name: "Rerun Test Customer" });
    await interestRepository.create({
      customerId: customer.id,
      categoryId: category.id,
      itemDescription: "sofa",
      keywords: ["sofa", "couch"],
    });
    const item = await inventoryRepository.create({
      title: "Mid-century sofa",
      category: category.name,
      keywords: ["sofa", "couch"],
    });

    await findMatchesForInventoryItem(item.id);
    await findMatchesForInventoryItem(item.id);

    const persisted = await matchRepository.listForInventoryItem(item.id);
    expect(persisted).toHaveLength(1);
  });
});
