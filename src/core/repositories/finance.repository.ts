import { prisma } from "@/lib/db/prisma";
import type { FinanceTransactionType, ModuleId } from "@/core/constants/enums";

export interface CreateFinanceTransactionInput {
  type: FinanceTransactionType;
  amountCents: number;
  category?: string;
  module?: ModuleId;
  contactId?: string;
  description?: string;
  occurredAt?: Date;
  recurring?: boolean;
  sourceType?: string;
  sourceId?: string;
}

export interface FinanceSummaryQuery {
  module?: ModuleId;
  from?: Date;
  to?: Date;
}

export const financeRepository = {
  async create(input: CreateFinanceTransactionInput) {
    return prisma.financeTransaction.create({ data: input });
  },

  async listByContact(contactId: string) {
    return prisma.financeTransaction.findMany({
      where: { contactId },
      orderBy: { occurredAt: "desc" },
    });
  },

  async listRecent(take = 20) {
    return prisma.financeTransaction.findMany({
      orderBy: { occurredAt: "desc" },
      take,
    });
  },

  /** Total income minus expenses, optionally scoped to a module and/or date range. */
  async summary(query: FinanceSummaryQuery = {}) {
    const { module, from, to } = query;
    const where = {
      module,
      occurredAt: from || to ? { gte: from, lte: to } : undefined,
    };
    const [income, expense] = await Promise.all([
      prisma.financeTransaction.aggregate({
        where: { ...where, type: "income" },
        _sum: { amountCents: true },
      }),
      prisma.financeTransaction.aggregate({
        where: { ...where, type: "expense" },
        _sum: { amountCents: true },
      }),
    ]);
    const incomeCents = income._sum.amountCents ?? 0;
    const expenseCents = expense._sum.amountCents ?? 0;
    return { incomeCents, expenseCents, profitCents: incomeCents - expenseCents };
  },

  /** Lifetime income total per contact, batched to avoid N+1 (e.g. matching-engine purchase counts). */
  async purchaseCountsByContact(params: { module?: ModuleId; contactIds: string[] }) {
    const rows = await prisma.financeTransaction.groupBy({
      by: ["contactId"],
      where: {
        type: "income",
        module: params.module,
        contactId: { in: params.contactIds },
      },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.contactId as string, row._count._all]));
  },
};
