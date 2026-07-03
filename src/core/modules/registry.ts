import type { ModuleManifest } from "@/core/modules/types";
import { marketplaceModule } from "@/modules/marketplace/manifest";
import { lawnCareModule } from "@/modules/lawn-care/manifest";
import { publishingModule } from "@/modules/publishing/manifest";
import { gameStudioModule } from "@/modules/game-studio/manifest";
import { aiProductsModule } from "@/modules/ai-products/manifest";
import { churchProjectsModule } from "@/modules/church-projects/manifest";

/**
 * The one central registration point for every module. Adding module #N
 * means: create src/modules/<name>/manifest.ts, import it here, add one
 * entry to this array. Sidebar nav, the unified dashboard, the AI
 * assistant's tool set, and contact-summary aggregation all iterate this
 * array — none of them branch on a module's identity by name.
 */
export const MODULES: ModuleManifest[] = [
  marketplaceModule,
  lawnCareModule,
  publishingModule,
  gameStudioModule,
  aiProductsModule,
  churchProjectsModule,
];
