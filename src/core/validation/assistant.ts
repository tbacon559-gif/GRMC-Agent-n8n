import { z } from "zod";

export const assistantQuerySchema = z.object({
  question: z.string().trim().min(3, "Ask a more specific question"),
});
export type AssistantQueryInput = z.infer<typeof assistantQuerySchema>;
