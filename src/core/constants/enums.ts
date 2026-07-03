/**
 * Single source of truth for every Core "enum-like" string field.
 *
 * These are plain string columns in Prisma, not native `enum` types,
 * because the SQLite connector used for local dev doesn't support enums at
 * all (only Postgres/MySQL/CockroachDB do). See
 * docs/decisions/0003-no-native-enums-on-sqlite.md.
 */

export const TASK_STATUSES = ["pending", "done", "dismissed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "normal", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const FINANCE_TRANSACTION_TYPES = ["income", "expense"] as const;
export type FinanceTransactionType = (typeof FINANCE_TRANSACTION_TYPES)[number];

export const MEMORY_KINDS = ["fact", "preference", "summary"] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

export const PREFERRED_CHANNELS = ["messenger", "phone", "email", "text"] as const;
export type PreferredChannel = (typeof PREFERRED_CHANNELS)[number];

/**
 * The registered module ids. This is the Core-side mirror of
 * src/core/modules/registry.ts — kept as a plain string union (rather than
 * derived from the registry at type-level) so Task/FinanceTransaction/etc.
 * validation schemas don't need a runtime import of every module.
 */
export const MODULE_IDS = [
  "marketplace",
  "lawn-care",
  "publishing",
  "game-studio",
  "ai-products",
  "church-projects",
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];
