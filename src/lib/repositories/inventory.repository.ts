import type { InventoryItem } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors";
import { categoryRepository } from "@/lib/repositories/category.repository";
import type {
  CreateInventoryItemInput,
  ListInventoryQuery,
  UpdateInventoryItemInput,
} from "@/lib/validation/inventory";

const withRelations = {
  include: { category: true, buyer: true },
} as const;

export const inventoryRepository = {
  async list(query: ListInventoryQuery = {}) {
    const { status, category, search, take = 50, skip = 0 } = query;
    return prisma.inventoryItem.findMany({
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

  async count(query: ListInventoryQuery = {}) {
    const { status, category, search } = query;
    return prisma.inventoryItem.count({
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
    return prisma.inventoryItem.findUnique({ where: { id }, ...withRelations });
  },

  async getByIdOrThrow(id: string) {
    const item = await this.findById(id);
    if (!item) throw new NotFoundError("InventoryItem", id);
    return item;
  },

  async create(input: CreateInventoryItemInput): Promise<InventoryItem> {
    const { category, marketplaceUrl, keywords, ...rest } = input;
    const categoryRecord = category
      ? await categoryRepository.findOrCreateByName(category)
      : null;
    return prisma.inventoryItem.create({
      data: {
        ...rest,
        marketplaceUrl: marketplaceUrl || null,
        categoryId: categoryRecord?.id,
        keywords: keywords ?? [],
        status: input.status ?? "acquired",
      },
    });
  },

  async update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem> {
    const { category, marketplaceUrl, keywords, ...rest } = input;
    const categoryRecord = category
      ? await categoryRepository.findOrCreateByName(category)
      : undefined;
    return prisma.inventoryItem.update({
      where: { id },
      data: {
        ...rest,
        marketplaceUrl: marketplaceUrl === "" ? null : marketplaceUrl,
        categoryId: categoryRecord?.id,
        keywords,
      },
    });
  },

  async markListed(id: string, dateListed: Date = new Date()): Promise<InventoryItem> {
    return prisma.inventoryItem.update({
      where: { id },
      data: { status: "listed", dateListed },
    });
  },

  async recordSale(
    id: string,
    params: { buyerId: string; salePriceCents: number; dateSold?: Date },
  ): Promise<InventoryItem> {
    return prisma.inventoryItem.update({
      where: { id },
      data: {
        status: "sold",
        buyerId: params.buyerId,
        salePriceCents: params.salePriceCents,
        dateSold: params.dateSold ?? new Date(),
      },
    });
  },

  async listRecentSales(take = 10) {
    return prisma.inventoryItem.findMany({
      where: { status: "sold" },
      ...withRelations,
      orderBy: { dateSold: "desc" },
      take,
    });
  },

  /** Listed/pending items ordered oldest-first, for the "inventory aging" widget. */
  async listAging(take = 20) {
    return prisma.inventoryItem.findMany({
      where: { status: { in: ["listed", "pending"] } },
      ...withRelations,
      orderBy: { dateListed: "asc" },
      take,
    });
  },

  /**
   * All sold items with category+buyer, for in-process analytics (top
   * buyers by category, fastest-selling categories). Bounded at 5000 rows —
   * fine for MVP scale; beyond that this should become a SQL GROUP BY
   * aggregate instead of an in-process scan.
   */
  async listAllSold(take = 5000) {
    return prisma.inventoryItem.findMany({
      where: { status: "sold" },
      ...withRelations,
      orderBy: { dateSold: "desc" },
      take,
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.inventoryItem.delete({ where: { id } });
  },
};
