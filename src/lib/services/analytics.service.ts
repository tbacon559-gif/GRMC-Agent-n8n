import { customerRepository } from "@/lib/repositories/customer.repository";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { interestRepository } from "@/lib/repositories/interest.repository";
import { matchRepository } from "@/lib/repositories/match.repository";
import { findMatchesForInventoryItem } from "@/lib/services/matching.service";
import { normalizeKeywords } from "@/lib/services/similarity";

/**
 * Read-only, question-shaped queries over the repository layer. This is
 * where the AI Assistant's tools get their data — see
 * src/lib/ai/assistant.ts and docs/decisions/0006-ai-assistant-tool-use.md.
 * Kept separate from dashboard.service.ts because these are ad hoc,
 * parameterized lookups rather than a fixed set of home-screen widgets.
 */

export async function searchCustomersByInterest(query: string) {
  const needle = query.trim().toLowerCase();
  const openInterests = await interestRepository.listAllOpen();
  return openInterests
    .filter((interest) => {
      const inDescription = interest.itemDescription.toLowerCase().includes(needle);
      const inKeywords = normalizeKeywords(interest.keywords).some((k) => k.includes(needle));
      return inDescription || inKeywords;
    })
    .map((interest) => ({
      customerId: interest.customer.id,
      customerName: interest.customer.name,
      itemDescription: interest.itemDescription,
      category: interest.category?.name ?? null,
      budgetCents: interest.budgetCents,
      interestedSince: interest.createdAt,
    }));
}

export async function getTopBuyersByCategory(categoryQuery: string) {
  const needle = categoryQuery.trim().toLowerCase();
  const soldItems = await inventoryRepository.listAllSold();
  const matching = soldItems.filter((item) => item.category?.name.toLowerCase().includes(needle));

  const byBuyer = new Map<
    string,
    { customerId: string; customerName: string; purchaseCount: number; totalSpentCents: number }
  >();
  for (const item of matching) {
    if (!item.buyer) continue;
    const existing = byBuyer.get(item.buyer.id) ?? {
      customerId: item.buyer.id,
      customerName: item.buyer.name,
      purchaseCount: 0,
      totalSpentCents: 0,
    };
    existing.purchaseCount += 1;
    existing.totalSpentCents += item.salePriceCents ?? 0;
    byBuyer.set(item.buyer.id, existing);
  }

  return [...byBuyer.values()].sort((a, b) => b.purchaseCount - a.purchaseCount);
}

export async function getFastestSellingCategories() {
  const soldItems = await inventoryRepository.listAllSold();
  const byCategory = new Map<string, { totalDays: number; count: number }>();

  for (const item of soldItems) {
    if (!item.category || !item.dateListed || !item.dateSold) continue;
    const days = (item.dateSold.getTime() - item.dateListed.getTime()) / (1000 * 60 * 60 * 24);
    const existing = byCategory.get(item.category.name) ?? { totalDays: 0, count: 0 };
    existing.totalDays += days;
    existing.count += 1;
    byCategory.set(item.category.name, existing);
  }

  return [...byCategory.entries()]
    .map(([category, { totalDays, count }]) => ({
      category,
      averageDaysToSell: Math.round((totalDays / count) * 10) / 10,
      soldCount: count,
    }))
    .sort((a, b) => a.averageDaysToSell - b.averageDaysToSell);
}

export async function getFastestResponders(limit = 10) {
  const customers = await customerRepository.list({ take: limit * 4 });
  return customers
    .slice()
    .sort((a, b) => b.responsivenessScore - a.responsivenessScore)
    .slice(0, limit)
    .map((c) => ({
      customerId: c.id,
      customerName: c.name,
      responsivenessScore: c.responsivenessScore,
      reliabilityScore: c.reliabilityScore,
    }));
}

export async function searchInventory(query: string) {
  const items = await inventoryRepository.list({ search: query, take: 10 });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    category: item.category?.name ?? null,
    askingPriceCents: item.askingPriceCents,
  }));
}

export async function getCustomerProfileByName(query: string) {
  const customers = await customerRepository.list({ search: query, take: 5 });
  if (!customers.length) return null;
  return customerRepository.getByIdOrThrow(customers[0].id);
}

/** Reuses persisted matches if present; otherwise scores live (e.g. for an item added before this feature, or whose interests changed since). */
export async function getMatchSuggestionsForItem(itemQuery: string) {
  const [byId, bySearch] = await Promise.all([
    inventoryRepository.findById(itemQuery),
    inventoryRepository.list({ search: itemQuery, take: 1 }),
  ]);
  const item = byId ?? bySearch[0];
  if (!item) return null;

  const existing = await matchRepository.listForInventoryItem(item.id);
  const matches = existing.length ? existing : await freshMatches(item.id);

  return {
    itemId: item.id,
    itemTitle: item.title,
    matches: matches.slice(0, 10).map((m) => ({
      customerName: m.customer.name,
      score: m.score,
      breakdown: m.breakdown,
    })),
  };
}

async function freshMatches(itemId: string) {
  const scored = await findMatchesForInventoryItem(itemId);
  return scored.map((m) => ({ customer: m.customer, score: m.score, breakdown: m.breakdown }));
}
