import type { InventoryItem } from "@/generated/prisma/client";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { findMatchesForInventoryItem, type ScoredMatch } from "@/lib/services/matching.service";
import type { CreateInventoryItemInput, RecordSaleInput } from "@/lib/validation/inventory";

export interface InventoryItemWithProfit extends InventoryItem {
  profitCents: number | null;
}

/**
 * Profit is never stored — it's always `salePriceCents - acquisitionCostCents`
 * computed here so it can't drift from its inputs if either is edited later.
 * See docs/decisions/0002-money-as-integer-cents.md.
 */
export function withProfit<T extends InventoryItem>(item: T): T & { profitCents: number | null } {
  const profitCents =
    item.salePriceCents != null && item.acquisitionCostCents != null
      ? item.salePriceCents - item.acquisitionCostCents
      : null;
  return { ...item, profitCents };
}

export interface CreateInventoryResult {
  item: InventoryItem;
  matches: ScoredMatch[];
}

/**
 * Creates the inventory item and immediately runs the matching engine
 * against it, per the core spec requirement: "Whenever inventory is added,
 * find every customer interested in similar products... before listing
 * publicly."
 */
export async function createInventoryItem(input: CreateInventoryItemInput): Promise<CreateInventoryResult> {
  const item = await inventoryRepository.create(input);
  const matches = await findMatchesForInventoryItem(item.id);
  return { item, matches };
}

export async function recordInventorySale(itemId: string, input: RecordSaleInput): Promise<InventoryItem> {
  const item = await inventoryRepository.recordSale(itemId, input);
  await customerRepository.recordPurchase(input.buyerId, input.salePriceCents);
  await customerRepository.touchLastContact(input.buyerId, input.dateSold ?? new Date());
  return item;
}
