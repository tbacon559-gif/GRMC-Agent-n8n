import { z } from "zod";
import { INVENTORY_STATUSES } from "@/lib/constants/enums";

export const inventoryStatusSchema = z.enum(INVENTORY_STATUSES);

export const createInventoryItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1).optional(),
  acquisitionSource: z.string().trim().optional(),
  acquisitionCostCents: z.number().int().min(0).optional(),
  askingPriceCents: z.number().int().min(0).optional(),
  marketplaceUrl: z.url().optional().or(z.literal("")),
  dateListed: z.coerce.date().optional(),
  status: inventoryStatusSchema.optional(),
  keywords: z.array(z.string().trim().min(1)).optional(),
});
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const updateInventoryItemSchema = createInventoryItemSchema.partial();
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;

export const recordSaleSchema = z.object({
  buyerId: z.string().min(1, "buyerId is required"),
  salePriceCents: z.number().int().min(0),
  dateSold: z.coerce.date().optional(),
});
export type RecordSaleInput = z.infer<typeof recordSaleSchema>;

export const listInventoryQuerySchema = z.object({
  status: inventoryStatusSchema.optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});
export type ListInventoryQuery = z.infer<typeof listInventoryQuerySchema>;
