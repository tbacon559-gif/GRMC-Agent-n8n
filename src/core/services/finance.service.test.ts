import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { contactRepository } from "@/core/repositories/contact.repository";
import { financeRepository } from "@/core/repositories/finance.repository";
import { getFinanceSummary } from "@/core/services/finance.service";

describe("finance.service (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("computes profit as income minus expenses, both all-time and per-module", async () => {
    const now = new Date("2026-05-15T00:00:00Z");

    await financeRepository.create({
      type: "income",
      amountCents: 10000,
      module: "marketplace",
      occurredAt: now,
    });
    await financeRepository.create({
      type: "expense",
      amountCents: 4000,
      module: "marketplace",
      occurredAt: now,
    });
    await financeRepository.create({
      type: "expense",
      amountCents: 2000,
      occurredAt: now,
    });

    const summary = await getFinanceSummary(now);

    expect(summary.byModule.marketplace.incomeCents).toBeGreaterThanOrEqual(10000);
    expect(summary.byModule.marketplace.profitCents).toBe(
      summary.byModule.marketplace.incomeCents - summary.byModule.marketplace.expenseCents,
    );
    expect(summary.allTime.profitCents).toBe(summary.allTime.incomeCents - summary.allTime.expenseCents);
  });

  it("purchaseCountsByContact batches purchase counts for the matching engine", async () => {
    const contact = await contactRepository.create({ name: "Finance Test Contact" });
    const contactId = contact.id;
    await financeRepository.create({
      type: "income",
      amountCents: 5000,
      module: "marketplace",
      contactId,
    });
    await financeRepository.create({
      type: "income",
      amountCents: 3000,
      module: "marketplace",
      contactId,
    });

    const counts = await financeRepository.purchaseCountsByContact({
      module: "marketplace",
      contactIds: [contactId],
    });

    expect(counts.get(contactId)).toBe(2);
  });
});
