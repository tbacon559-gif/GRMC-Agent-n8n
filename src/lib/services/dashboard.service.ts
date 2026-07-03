import { prisma } from "@/lib/db/prisma";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { matchRepository } from "@/lib/repositories/match.repository";
import { reminderRepository } from "@/lib/repositories/reminder.repository";
import { withProfit } from "@/lib/services/inventory.service";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function monthlyProfitCents(now: Date): Promise<number> {
  const soldThisMonth = await prisma.inventoryItem.findMany({
    where: { status: "sold", dateSold: { gte: startOfMonth(now) } },
    select: { salePriceCents: true, acquisitionCostCents: true },
  });
  return soldThisMonth.reduce((sum, item) => {
    if (item.salePriceCents == null || item.acquisitionCostCents == null) return sum;
    return sum + (item.salePriceCents - item.acquisitionCostCents);
  }, 0);
}

/**
 * Rule-based recommendations rather than an AI call on every dashboard
 * load — keeps the home screen fast, free, and available even without an
 * ANTHROPIC_API_KEY configured. The natural-language AI Assistant (a
 * separate feature) is where an actual model call makes sense, because
 * that's an explicit, occasional user action.
 */
function buildRecommendations(input: {
  agingCount: number;
  overdueReminderCount: number;
  staleHighValueCustomerCount: number;
}): string[] {
  const recommendations: string[] = [];
  if (input.agingCount > 0) {
    recommendations.push(
      `${input.agingCount} listing(s) have been sitting for a while — consider a price drop or re-listing.`,
    );
  }
  if (input.overdueReminderCount > 0) {
    recommendations.push(
      `${input.overdueReminderCount} follow-up(s) are overdue — reach out before these leads go cold.`,
    );
  }
  if (input.staleHighValueCustomerCount > 0) {
    recommendations.push(
      `${input.staleHighValueCustomerCount} repeat buyer(s) haven't been contacted in over 60 days — a quick check-in could surface a new sale.`,
    );
  }
  if (!recommendations.length) {
    recommendations.push("Nothing urgent — you're on top of things.");
  }
  return recommendations;
}

export async function getDashboardData(now: Date = new Date()) {
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    newLeads,
    followUpsDue,
    newInventory,
    recentSales,
    topMatches,
    agingInventory,
    profitCents,
    staleHighValueCustomers,
  ] = await Promise.all([
    customerRepository.list({ status: "prospect", take: 5 }),
    reminderRepository.listDue(now, 10),
    inventoryRepository.list({ status: "acquired", take: 5 }),
    inventoryRepository.listRecentSales(5),
    matchRepository.listTopSuggested(10),
    inventoryRepository.listAging(10),
    monthlyProfitCents(now),
    prisma.customer.count({
      where: {
        totalPurchases: { gt: 0 },
        OR: [{ lastContactAt: null }, { lastContactAt: { lt: sixtyDaysAgo } }],
      },
    }),
  ]);

  return {
    newLeads,
    followUpsDue,
    newInventory,
    recentSales: recentSales.map(withProfit),
    suggestedMatches: topMatches,
    agingInventory,
    monthlyProfitCents: profitCents,
    recommendations: buildRecommendations({
      agingCount: agingInventory.length,
      overdueReminderCount: followUpsDue.length,
      staleHighValueCustomerCount: staleHighValueCustomers,
    }),
    generatedAt: now,
    windowStart: fourteenDaysAgo,
  };
}
