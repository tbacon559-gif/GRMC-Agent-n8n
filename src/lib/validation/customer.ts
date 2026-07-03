import { z } from "zod";
import { CUSTOMER_STATUSES } from "@/lib/constants/enums";

export const customerStatusSchema = z.enum(CUSTOMER_STATUSES);

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  facebookProfileUrl: z.url().optional().or(z.literal("")),
  messengerThreadId: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  status: customerStatusSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  aiSummary: z.string().optional(),
  reliabilityScore: z.number().min(0).max(100).optional(),
  responsivenessScore: z.number().min(0).max(100).optional(),
});
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const addNoteSchema = z.object({
  body: z.string().trim().min(1, "Note body is required"),
});
export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const listCustomersQuerySchema = z.object({
  status: customerStatusSchema.optional(),
  search: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
