import { marketplaceInterestRepository } from "@/modules/marketplace/repositories/marketplace-interest.repository";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { marketplaceMatchRepository } from "@/modules/marketplace/repositories/marketplace-match.repository";
import { marketplaceProfileRepository } from "@/modules/marketplace/repositories/marketplace-profile.repository";
import { contactRepository } from "@/core/repositories/contact.repository";
import { financeRepository } from "@/core/repositories/finance.repository";
import { findMatchesForInventoryItem } from "@/modules/marketplace/services/matching.service";
import { normalizeKeywords } from "@/modules/marketplace/services/similarity";

/**
 * Read-only, question-shaped queries over the Marketplace repository layer.
 * This is where the AI Assistant's Marketplace tools get their data — see
 * src/modules/marketplace/manifest.ts and
 * docs/decisions/0006-ai-assistant-tool-use.md. Kept separate from any
 * fixed dashboard-widget shape because these are ad hoc, parameterized
 * lookups rather than a fixed set of home-screen stats.
 */

export async function searchContactsByInterest(query: string) {
  const needle = query.trim().toLowerCase();
  const openInterests = await marketplaceInterestRepository.listAllOpen();
  return openInterests
    .filter((interest) => {
      const inDescription = interest.itemDescription.toLowerCase().includes(needle);
      const inKeywords = normalizeKeywords(interest.keywords).some((k) => k.includes(needle));
      return inDescription || inKeywords;
    })
    .map((interest) => ({
      contactId: interest.contact.id,
      contactName: interest.contact.name,
      itemDescription: interest.itemDescription,
      category: interest.category?.name ?? null,
      budgetCents: interest.budgetCents,
      interestedSince: interest.createdAt,
    }));
}

export async function getTopBuyersByCategory(categoryQuery: string) {
  const needle = categoryQuery.trim().toLowerCase();
  const soldItems = await marketplaceItemRepository.listAllSold();
  const matching = soldItems.filter((item) => item.category?.name.toLowerCase().includes(needle));

  const byBuyer = new Map<
    string,
    { contactId: string; contactName: string; purchaseCount: number; totalSpentCents: number }
  >();
  for (const item of matching) {
    if (!item.contact) continue;
    const existing = byBuyer.get(item.contact.id) ?? {
      contactId: item.contact.id,
      contactName: item.contact.name,
      purchaseCount: 0,
      totalSpentCents: 0,
    };
    existing.purchaseCount += 1;
    existing.totalSpentCents += item.salePriceCents ?? 0;
    byBuyer.set(item.contact.id, existing);
  }

  return [...byBuyer.values()].sort((a, b) => b.purchaseCount - a.purchaseCount);
}

export async function getFastestSellingCategories() {
  const soldItems = await marketplaceItemRepository.listAllSold();
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
  const contacts = await contactRepository.list({ take: limit * 4 });
  const profiles = await Promise.all(
    contacts.map((contact) => marketplaceProfileRepository.findByContactId(contact.id)),
  );
  return contacts
    .map((contact, i) => ({ contact, profile: profiles[i] }))
    .filter((row): row is { contact: typeof contacts[number]; profile: NonNullable<typeof row.profile> } =>
      row.profile != null,
    )
    .sort((a, b) => b.profile.responsivenessScore - a.profile.responsivenessScore)
    .slice(0, limit)
    .map(({ contact, profile }) => ({
      contactId: contact.id,
      contactName: contact.name,
      responsivenessScore: profile.responsivenessScore,
      reliabilityScore: profile.reliabilityScore,
    }));
}

export async function searchInventory(query: string) {
  const items = await marketplaceItemRepository.list({ search: query, take: 10 });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    category: item.category?.name ?? null,
    askingPriceCents: item.askingPriceCents,
  }));
}

export async function getContactProfileByName(query: string) {
  const contacts = await contactRepository.list({ search: query, take: 5 });
  if (!contacts.length) return null;
  const contact = await contactRepository.getByIdOrThrow(contacts[0].id);
  const [profile, transactions] = await Promise.all([
    marketplaceProfileRepository.findByContactId(contact.id),
    financeRepository.listByContact(contact.id),
  ]);
  return { ...contact, marketplaceProfile: profile, financeHistory: transactions };
}

/** Reuses persisted matches if present; otherwise scores live (e.g. for an item added before this feature, or whose interests changed since). */
export async function getMatchSuggestionsForItem(itemQuery: string) {
  const [byId, bySearch] = await Promise.all([
    marketplaceItemRepository.findById(itemQuery),
    marketplaceItemRepository.list({ search: itemQuery, take: 1 }),
  ]);
  const item = byId ?? bySearch[0];
  if (!item) return null;

  const existing = await marketplaceMatchRepository.listForItem(item.id);
  const matches = existing.length ? existing : await freshMatches(item.id);

  return {
    itemId: item.id,
    itemTitle: item.title,
    matches: matches.slice(0, 10).map((m) => ({
      contactName: m.contact.name,
      score: m.score,
      breakdown: m.breakdown,
    })),
  };
}

async function freshMatches(itemId: string) {
  const scored = await findMatchesForInventoryItem(itemId);
  return scored.map((m) => ({ contact: m.contact, score: m.score, breakdown: m.breakdown }));
}
