import type { LucideIcon } from "lucide-react";
import type { ToolDef } from "@/core/ai/tool";
import type { ModuleId } from "@/core/constants/enums";

/** Data a module contributes to the unified dashboard, rendered by the generic `<ModuleWidgetCard>`. */
export interface ModuleWidgetData {
  id: string;
  title: string;
  stats: Array<{ label: string; value: string }>;
  items?: Array<{ label: string; href?: string }>;
}

/** A short module-scoped fact or status shown on a contact's profile — the "business membership" hook. */
export interface ContactModuleSummary {
  label: string;
  detail: string;
}

/**
 * The plugin contract every module registers under
 * src/core/modules/registry.ts. This is static-import composition
 * verified at build time, not runtime plugin loading — Next.js requires
 * routes under src/app/** at build time, so a module still needs its own
 * thin page/route file. See docs/decisions/0010-module-manifest-and-registry.md
 * for the honest scope of what "pluggable" means here.
 */
export interface ModuleManifest {
  id: ModuleId;
  name: string;
  nav: { href: string; label: string; icon: LucideIcon };
  /** Contributes a section to the unified dashboard. */
  dashboardWidget?: () => Promise<ModuleWidgetData>;
  /** Contributes tools to the AI assistant's tool-use loop. */
  assistantTools?: () => ToolDef[];
  /** Contributes bullet facts to the on-demand AI Chief of Staff briefing. */
  briefingContributor?: (ctx: { now: Date }) => Promise<string[]>;
  /** Looks up this module's relationship to a contact, if any (e.g. "Marketplace buyer"). */
  getContactSummary?: (contactId: string) => Promise<ContactModuleSummary | null>;
}
