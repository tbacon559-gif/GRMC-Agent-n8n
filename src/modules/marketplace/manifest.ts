import { z } from "zod";
import { Store } from "lucide-react";
import { defineTool } from "@/core/ai/tool";
import type { ModuleManifest } from "@/core/modules/types";
import { financeRepository } from "@/core/repositories/finance.repository";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { marketplaceMatchRepository } from "@/modules/marketplace/repositories/marketplace-match.repository";
import { marketplaceProfileRepository } from "@/modules/marketplace/repositories/marketplace-profile.repository";
import * as analytics from "@/modules/marketplace/services/analytics.service";
import { formatCents } from "@/lib/money";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const marketplaceModule: ModuleManifest = {
  id: "marketplace",
  name: "Marketplace",
  nav: { href: "/marketplace", label: "Marketplace", icon: Store },

  async dashboardWidget() {
    const now = new Date();
    const [newInventory, agingInventory, topMatches, revenue] = await Promise.all([
      marketplaceItemRepository.list({ status: "acquired", take: 5 }),
      marketplaceItemRepository.listAging(10),
      marketplaceMatchRepository.listTopSuggested(5),
      financeRepository.summary({ module: "marketplace", from: startOfMonth(now), to: now }),
    ]);

    return {
      id: "marketplace",
      title: "Marketplace",
      stats: [
        { label: "New inventory", value: String(newInventory.length) },
        { label: "Aging listings", value: String(agingInventory.length) },
        { label: "This month's profit", value: formatCents(revenue.profitCents) },
      ],
      items: topMatches.map((match) => ({
        label: `${match.contact.name} — ${match.item.title} (${match.score})`,
        href: `/marketplace/${match.item.id}`,
      })),
    };
  },

  assistantTools: () => [
    defineTool({
      name: "search_contacts_by_marketplace_interest",
      description:
        "Find contacts with an open Marketplace interest matching a keyword or item description, e.g. 'kitchenaid mixer' or 'patio set'.",
      schema: z.object({ query: z.string().describe("Keyword or item description to search for") }),
      run: ({ query }) => analytics.searchContactsByInterest(query),
    }),
    defineTool({
      name: "get_top_buyers_by_category",
      description: "Find contacts who have previously bought Marketplace items in a given category, ranked by purchase count.",
      schema: z.object({ category: z.string().describe("Category name or keyword, e.g. 'kitchen appliances'") }),
      run: ({ category }) => analytics.getTopBuyersByCategory(category),
    }),
    defineTool({
      name: "get_fastest_selling_categories",
      description: "List Marketplace categories ranked by average days-to-sell, fastest first.",
      schema: z.object({}),
      run: () => analytics.getFastestSellingCategories(),
    }),
    defineTool({
      name: "get_fastest_responders",
      description: "List Marketplace contacts ranked by how quickly they typically respond (responsiveness score).",
      schema: z.object({ limit: z.number().int().min(1).max(50).optional() }),
      run: ({ limit }) => analytics.getFastestResponders(limit),
    }),
    defineTool({
      name: "search_marketplace_inventory",
      description: "Search Marketplace inventory items by title/description keyword.",
      schema: z.object({ query: z.string() }),
      run: ({ query }) => analytics.searchInventory(query),
    }),
    defineTool({
      name: "get_marketplace_contact_profile",
      description:
        "Look up a contact's Marketplace profile (status, purchase history, reliability, open interests) by name.",
      schema: z.object({ query: z.string().describe("Contact name or partial name") }),
      run: ({ query }) => analytics.getContactProfileByName(query),
    }),
    defineTool({
      name: "get_match_suggestions_for_item",
      description:
        "Get the ranked list of contacts recommended to contact about a specific Marketplace item, by item id or title.",
      schema: z.object({ itemQuery: z.string() }),
      run: ({ itemQuery }) => analytics.getMatchSuggestionsForItem(itemQuery),
    }),
  ],

  async briefingContributor({ now }) {
    const [revenue, agingInventory, topMatches] = await Promise.all([
      financeRepository.summary({ module: "marketplace", from: startOfMonth(now), to: now }),
      marketplaceItemRepository.listAging(5),
      marketplaceMatchRepository.listTopSuggested(3),
    ]);

    const facts: string[] = [
      `Marketplace: ${formatCents(revenue.profitCents)} profit this month.`,
    ];
    if (agingInventory.length) {
      facts.push(`${agingInventory.length} Marketplace listing(s) have been sitting for a while.`);
    }
    if (topMatches.length) {
      facts.push(
        `Top Marketplace match: ${topMatches[0].contact.name} for "${topMatches[0].item.title}" (score ${topMatches[0].score}).`,
      );
    }
    return facts;
  },

  async getContactSummary(contactId: string) {
    const profile = await marketplaceProfileRepository.findByContactId(contactId);
    if (!profile) return null;
    return {
      label: "Marketplace",
      detail: `${profile.status} · reliability ${Math.round(profile.reliabilityScore)} · responsiveness ${Math.round(profile.responsivenessScore)}`,
    };
  },
};
