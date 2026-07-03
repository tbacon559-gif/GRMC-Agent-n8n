import type { MarketplaceItem } from "@/generated/prisma/client";
import { contactRepository } from "@/core/repositories/contact.repository";
import { financeRepository } from "@/core/repositories/finance.repository";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { marketplaceProfileRepository } from "@/modules/marketplace/repositories/marketplace-profile.repository";
import { findMatchesForInventoryItem, type ScoredMatch } from "@/modules/marketplace/services/matching.service";
import type { CreateMarketplaceItemInput, RecordSaleInput } from "@/modules/marketplace/validation/inventory";

export interface MarketplaceItemWithProfit extends MarketplaceItem {
  profitCents: number | null;
}

/**
 * Profit is never stored — it's always `salePriceCents - acquisitionCostCents`
 * computed here so it can't drift from its inputs if either is edited later.
 * See docs/decisions/0002-money-as-integer-cents.md.
 */
export function withProfit<T extends MarketplaceItem>(item: T): T & { profitCents: number | null } {
  const profitCents =
    item.salePriceCents != null && item.acquisitionCostCents != null
      ? item.salePriceCents - item.acquisitionCostCents
      : null;
  return { ...item, profitCents };
}

export interface CreateMarketplaceItemResult {
  item: MarketplaceItem;
  matches: ScoredMatch[];
}

/**
 * Creates the marketplace item, records its acquisition cost as a Finance
 * expense (if any), and immediately runs the matching engine against it —
 * per the core spec requirement: "Whenever inventory is added, find every
 * contact interested in similar products... before listing publicly."
 */
export async function createMarketplaceItem(
  input: CreateMarketplaceItemInput,
): Promise<CreateMarketplaceItemResult> {
  const item = await marketplaceItemRepository.create(input);

  if (item.acquisitionCostCents) {
    await financeRepository.create({
      type: "expense",
      amountCents: item.acquisitionCostCents,
      category: "acquisition",
      module: "marketplace",
      description: `Acquired: ${item.title}`,
      occurredAt: item.createdAt,
      sourceType: "MarketplaceItem",
      sourceId: item.id,
    });
  }

  const matches = await findMatchesForInventoryItem(item.id);
  return { item, matches };
}

export async function recordMarketplaceSale(
  itemId: string,
  input: RecordSaleInput,
): Promise<MarketplaceItem> {
  const item = await marketplaceItemRepository.recordSale(itemId, input);
  const occurredAt = input.dateSold ?? new Date();

  await financeRepository.create({
    type: "income",
    amountCents: input.salePriceCents,
    category: "sale",
    module: "marketplace",
    contactId: input.contactId,
    description: `Sold: ${item.title}`,
    occurredAt,
    sourceType: "MarketplaceItem",
    sourceId: item.id,
  });
  await marketplaceProfileRepository.updateStatus(input.contactId, "buyer");
  await contactRepository.touchLastContact(input.contactId, occurredAt);

  return item;
}
