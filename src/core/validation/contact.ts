import { z } from "zod";
import { PREFERRED_CHANNELS } from "@/core/constants/enums";

export const preferredChannelSchema = z.enum(PREFERRED_CHANNELS);

export const createContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  facebookProfileUrl: z.url().optional().or(z.literal("")),
  messengerThreadId: z.string().trim().optional(),
  preferredChannel: preferredChannelSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial().extend({
  aiSummaryCache: z.string().optional(),
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const addNoteSchema = z.object({
  body: z.string().trim().min(1, "Note body is required"),
});
export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const listContactsQuerySchema = z.object({
  search: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
