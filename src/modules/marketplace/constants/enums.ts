/**
 * Marketplace-module "enum-like" string fields. Same no-native-enums
 * reasoning as src/core/constants/enums.ts — see
 * docs/decisions/0003-no-native-enums-on-sqlite.md.
 */

export const MARKETPLACE_PROFILE_STATUSES = ["prospect", "buyer", "seller"] as const;
export type MarketplaceProfileStatus = (typeof MARKETPLACE_PROFILE_STATUSES)[number];

export const INVENTORY_STATUSES = ["acquired", "listed", "pending", "sold", "removed"] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export const CONVERSATION_SOURCES = ["messenger", "manual", "other"] as const;
export type ConversationSource = (typeof CONVERSATION_SOURCES)[number];

export const URGENCY_LEVELS = ["low", "medium", "high"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const BUYING_INTENT_LEVELS = ["low", "medium", "high"] as const;
export type BuyingIntentLevel = (typeof BUYING_INTENT_LEVELS)[number];

export const SENTIMENTS = ["positive", "neutral", "negative"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const INTEREST_STATUSES = ["open", "fulfilled", "expired"] as const;
export type InterestStatus = (typeof INTEREST_STATUSES)[number];

export const MATCH_STATUSES = ["suggested", "contacted", "dismissed", "converted"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];
