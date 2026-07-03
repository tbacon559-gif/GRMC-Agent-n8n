import { z } from "zod";
import { MARKETPLACE_PROFILE_STATUSES } from "@/modules/marketplace/constants/enums";

export const updateMarketplaceProfileSchema = z.object({
  status: z.enum(MARKETPLACE_PROFILE_STATUSES),
});
export type UpdateMarketplaceProfileInput = z.infer<typeof updateMarketplaceProfileSchema>;
