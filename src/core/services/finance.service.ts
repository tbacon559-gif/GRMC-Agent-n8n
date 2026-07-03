import { financeRepository } from "@/core/repositories/finance.repository";
import { MODULE_IDS, type ModuleId } from "@/core/constants/enums";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * The single place revenue/profit/lifetime-value are computed from the
 * FinanceTransaction ledger — every module's sales/expenses flow through
 * here rather than a per-module denormalized counter. See
 * docs/decisions/0011-finance-ledger-over-counters.md.
 */
export async function getFinanceSummary(now: Date = new Date()) {
  const [allTime, thisMonth, byModuleEntries] = await Promise.all([
    financeRepository.summary(),
    financeRepository.summary({ from: startOfMonth(now), to: now }),
    Promise.all(
      MODULE_IDS.map(async (module) => [module, await financeRepository.summary({ module })] as const),
    ),
  ]);

  return {
    allTime,
    thisMonth,
    byModule: Object.fromEntries(byModuleEntries) as Record<ModuleId, Awaited<ReturnType<typeof financeRepository.summary>>>,
  };
}

export async function getModuleRevenueThisMonth(module: ModuleId, now: Date = new Date()) {
  return financeRepository.summary({ module, from: startOfMonth(now), to: now });
}
