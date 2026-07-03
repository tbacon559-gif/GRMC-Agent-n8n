import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { tagRepository } from "@/lib/repositories/tag.repository";

/**
 * Regression coverage for a real bug: `createMany({ skipDuplicates: true })`
 * isn't supported on SQLite, so tag attachment uses per-row `upsert` on the
 * composite key instead (see docs/decisions/0007). These tests would have
 * caught that at the type level (TS rejected `skipDuplicates` outright) but
 * are kept as behavioral coverage for the upsert-based replacement.
 */
describe("tagRepository (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("normalizes and dedupes tag names, reusing existing tags across customers", async () => {
    const alice = await customerRepository.create({ name: "Tag Test Alice" });
    const bob = await customerRepository.create({ name: "Tag Test Bob" });

    await tagRepository.attachToCustomer(alice.id, ["VIP", " vip ", "Repeat-Buyer"]);
    await tagRepository.attachToCustomer(bob.id, ["vip"]);

    const [aliceRecord, bobRecord] = await Promise.all([
      customerRepository.findById(alice.id),
      customerRepository.findById(bob.id),
    ]);

    expect(aliceRecord!.tags.map((t) => t.tag.name).sort()).toEqual(["repeat-buyer", "vip"]);
    expect(bobRecord!.tags.map((t) => t.tag.name)).toEqual(["vip"]);

    const aliceVipTagId = aliceRecord!.tags.find((t) => t.tag.name === "vip")!.tagId;
    const bobVipTagId = bobRecord!.tags.find((t) => t.tag.name === "vip")!.tagId;
    expect(aliceVipTagId).toBe(bobVipTagId);
  });

  it("attaching the same tag twice does not create a duplicate join row", async () => {
    const customer = await customerRepository.create({ name: "Tag Test Idempotent" });

    await tagRepository.attachToCustomer(customer.id, ["hot-lead"]);
    await tagRepository.attachToCustomer(customer.id, ["hot-lead"]);

    const record = await customerRepository.findById(customer.id);
    expect(record!.tags).toHaveLength(1);
  });

  it("replaceCustomerTags swaps the full tag set", async () => {
    const customer = await customerRepository.create({ name: "Tag Test Replace" });
    await tagRepository.attachToCustomer(customer.id, ["old-tag"]);

    await tagRepository.replaceCustomerTags(customer.id, ["new-tag-a", "new-tag-b"]);

    const record = await customerRepository.findById(customer.id);
    expect(record!.tags.map((t) => t.tag.name).sort()).toEqual(["new-tag-a", "new-tag-b"]);
  });
});
