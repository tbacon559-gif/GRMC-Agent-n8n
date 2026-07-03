import type { MarketplaceItem } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors";
import { marketplaceCategoryRepository } from "@/modules/marketplace/repositories/marketplace-category.repository";
import type {
  CreateMarketplaceItemInput,
  ListMarketplaceItemsQuery,
  UpdateMarketplaceItemInput,
} from "@/modules/marketplace/validation/inventory";

const withRelations = {
  include: { category: true, contact: true },
} as const;

export const marketplaceItemRepository = {
  async list(query: ListMarketplaceItemsQuery = {}) {
    const { status, category, search, take = 50, skip = 0 } = query;
    return prisma.marketplaceItem.findMany({
      where: {
        status,
        category: category ? { name: category } : undefined,
        OR: search
          ? [{ title: { contains: search } }, { description: { contains: search } }]
          : undefined,
      },
      ...withRelations,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  },

  async count(query: ListMarketplaceItemsQuery = {}) {
    const { status, category, search } = query;
    return prisma.marketplaceItem.count({
      where: {
        status,
        category: category ? { name: category } : undefined,
        OR: search
          ? [{ title: { contains: search } }, { description: { contains: search } }]
          : undefined,
      },
    });
  },

  async findById(id: string) {
    return prisma.marketplaceItem.findUnique({ where: { id }, ...withRelations });
  },

  async getByIdOrThrow(id: string) {
    const item = await this.findById(id);
    if (!item) throw new NotFoundError("MarketplaceItem", id);
    return item;
  },

  async create(input: CreateMarketplaceItemInput): Promise<MarketplaceItem> {
    const { category, marketplaceUrl, keywords, ...rest } = input;
    const categoryRecord = category
      ? await marketplaceCategoryRepository.findOrCreateByName(category)
      : null;
    return prisma.marketplaceItem.create({
      data: {
        ...rest,
        marketplaceUrl: marketplaceUrl || null,
        categoryId: categoryRecord?.id,
        keywords: keywords ?? [],
        status: input.status ?? "acquired",
      },
    });
  },

  async update(id: string, input: UpdateMarketplaceItemInput): Promise<MarketplaceItem> {
    const { category, marketplaceUrl, keywords, ...rest } = input;
    const categoryRecord = category
      ? await marketplaceCategoryRepository.findOrCreateByName(category)
      : undefined;
    return prisma.marketplaceItem.update({
      where: { id },
      data: {
        ...rest,
        marketplaceUrl: marketplaceUrl === "" ? null : marketplaceUrl,
        categoryId: categoryRecord?.id,
        keywords,
      },
    });
  },

  async markListed(id: string, dateListed: Date = new Date()): Promise<MarketplaceItem> {
    return prisma.marketplaceItem.update({
      where: { id },
      data: { status: "listed", dateListed },
    });
  },

  async recordSale(
    id: string,
    params: { contactId: string; salePriceCents: number; dateSold?: Date },
  ): Promise<MarketplaceItem> {
    return prisma.marketplaceItem.update({
      where: { id },
      data: {
        status: "sold",
        contactId: params.contactId,
        salePriceCents: params.salePriceCents,
        dateSold: params.dateSold ?? new Date(),
      },
    });
  },

  async listRecentSales(take = 10) {
    return prisma.marketplaceItem.findMany({
      where: { status: "sold" },
      ...withRelations,
      orderBy: { dateSold: "desc" },
      take,
    });
  },

  /** Listed/pending items ordered oldest-first, for the "inventory aging" widget. */
  async listAging(take = 20) {
    return prisma.marketplaceItem.findMany({
      where: { status: { in: ["listed", "pending"] } },
      ...withRelations,
      orderBy: { dateListed: "asc" },
      take,
    });
  },

  /**
   * All sold items with category+contact, for in-process analytics (top
   * buyers by category, fastest-selling categories). Bounded at 5000 rows —
   * fine for MVP scale; beyond that this should become a SQL GROUP BY
   * aggregate instead of an in-process scan.
   */
  async listAllSold(take = 5000) {
    return prisma.marketplaceItem.findMany({
      where: { status: "sold" },
      ...withRelations,
      orderBy: { dateSold: "desc" },
      take,
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.marketplaceItem.delete({ where: { id } });
  },
};
