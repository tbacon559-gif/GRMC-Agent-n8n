import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { contactRepository } from "@/core/repositories/contact.repository";
import { memoryRepository } from "@/core/repositories/memory.repository";

/**
 * The whole point of ContactMemoryEntry is that it is append-only — a
 * correction or update never overwrites a prior entry, it just adds a new
 * one. See docs/decisions/0009-ai-memory-append-only-log.md.
 */
describe("memoryRepository (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("never overwrites — two creates for the same contact produce two rows", async () => {
    const contact = await contactRepository.create({ name: "Memory Test Contact" });

    await memoryRepository.create({ contactId: contact.id, kind: "fact", content: "Owns two dogs" });
    await memoryRepository.create({
      contactId: contact.id,
      kind: "fact",
      content: "Prefers texting over calls",
    });

    const entries = await memoryRepository.listByContact(contact.id);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.content).sort()).toEqual(["Owns two dogs", "Prefers texting over calls"]);
  });

  it("distinguishes universal facts (module null) from module-specific ones", async () => {
    const contact = await contactRepository.create({ name: "Memory Scope Test Contact" });

    await memoryRepository.create({ contactId: contact.id, kind: "fact", content: "Universal fact" });
    await memoryRepository.create({
      contactId: contact.id,
      module: "marketplace",
      kind: "summary",
      content: "Marketplace-specific summary",
    });

    const entries = await memoryRepository.listByContact(contact.id);
    expect(entries.find((e) => e.content === "Universal fact")?.module).toBeNull();
    expect(entries.find((e) => e.content === "Marketplace-specific summary")?.module).toBe("marketplace");
  });
});
