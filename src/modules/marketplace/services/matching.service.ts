import type { Contact, MarketplaceInterest, MarketplaceItem, Prisma } from "@/generated/prisma/client";
import { financeRepository } from "@/core/repositories/finance.repository";
import { marketplaceInterestRepository } from "@/modules/marketplace/repositories/marketplace-interest.repository";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { marketplaceMatchRepository } from "@/modules/marketplace/repositories/marketplace-match.repository";
import { centsToDollars } from "@/lib/money";
import { clamp, keywordSimilarity, overlappingKeywords, recencyScore } from "@/modules/marketplace/services/similarity";

/**
 * Relative weight of each signal in the final 0-100 match score. Kept as
 * named constants (rather than buried magic numbers) so tuning the ranking
 * behavior is a one-line change with an obvious blast radius. Weights sum to
 * 1. See docs/decisions/0004-matching-engine-design.md for why these five
 * signals and why deterministic scoring instead of an AI call per match.
 */
export const MATCH_WEIGHTS = {
  similarity: 0.35,
  buyingHistory: 0.15,
  recency: 0.2,
  responsiveness: 0.15,
  reliability: 0.15,
} as const;

/** Below this score a match isn't worth surfacing or persisting. */
export const MATCH_SCORE_THRESHOLD = 20;

/** How many top matches to keep per marketplace item. */
export const MAX_MATCHES_PER_ITEM = 25;

const CONTACT_RECENCY_HALF_LIFE_DAYS = 30;
const INTEREST_RECENCY_HALF_LIFE_DAYS = 45;

export interface MatchBreakdown {
  similarity: number;
  buyingHistory: number;
  recency: number;
  responsiveness: number;
  reliability: number;
  reasons: string[];
}

/**
 * Everything the scorer needs about a contact, decoupled from any single
 * Prisma model — `lastContactAt` lives on Core's Contact, reliability/
 * responsiveness on Marketplace's own MarketplaceProfile, and purchaseCount
 * is derived from the Finance ledger. See docs/decisions/0011.
 */
export interface ContactScoringContext {
  lastContactAt: Date | null;
  reliabilityScore: number;
  responsivenessScore: number;
  purchaseCount: number;
}

export interface ScoredMatch {
  contact: Contact;
  interest: MarketplaceInterest;
  score: number;
  breakdown: MatchBreakdown;
}

/** Repeat buyers rank higher. Simple linear scale, capped at 100 by ~7 purchases. */
function buyingHistoryScore(purchaseCount: number): number {
  return clamp(purchaseCount * 15, 0, 100);
}

export function scoreInterest(
  item: Pick<MarketplaceItem, "categoryId" | "keywords">,
  interest: MarketplaceInterest,
  scoringContext: ContactScoringContext,
  now: Date = new Date(),
): { score: number; breakdown: MatchBreakdown } {
  const categoryMatches = Boolean(item.categoryId) && item.categoryId === interest.categoryId;
  const keywordScore = keywordSimilarity(item.keywords, interest.keywords);
  const similarity = categoryMatches ? clamp(60 + keywordScore * 0.4, 0, 100) : keywordScore;

  const contactRecency = recencyScore(scoringContext.lastContactAt, now, CONTACT_RECENCY_HALF_LIFE_DAYS);
  const interestRecency = recencyScore(interest.createdAt, now, INTEREST_RECENCY_HALF_LIFE_DAYS, 50);
  const recency = Math.round((contactRecency + interestRecency) / 2);

  const buyingHistory = buyingHistoryScore(scoringContext.purchaseCount);
  const responsiveness = scoringContext.responsivenessScore;
  const reliability = scoringContext.reliabilityScore;

  const score = Math.round(
    similarity * MATCH_WEIGHTS.similarity +
      buyingHistory * MATCH_WEIGHTS.buyingHistory +
      recency * MATCH_WEIGHTS.recency +
      responsiveness * MATCH_WEIGHTS.responsiveness +
      reliability * MATCH_WEIGHTS.reliability,
  );

  const reasons: string[] = [];
  if (categoryMatches) reasons.push("Interested in this category");
  const overlap = overlappingKeywords(item.keywords, interest.keywords);
  if (overlap.length) reasons.push(`Matches keywords: ${overlap.join(", ")}`);
  if (scoringContext.purchaseCount > 0) {
    reasons.push(`Repeat customer — ${scoringContext.purchaseCount} past purchase(s)`);
  }
  if (scoringContext.lastContactAt) {
    const days = Math.round(
      (now.getTime() - scoringContext.lastContactAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    reasons.push(days <= 3 ? "Contacted recently" : `Last contacted ${days} days ago`);
  } else {
    reasons.push("Never contacted before");
  }
  if (reliability >= 75) reasons.push("High reliability score");
  if (responsiveness >= 75) reasons.push("Usually responds quickly");

  return {
    score,
    breakdown: { similarity, buyingHistory, recency, responsiveness, reliability, reasons },
  };
}

/**
 * The matching engine's entry point: given a marketplace item, find every
 * contact with an open interest in similar products, score and rank them,
 * persist the suggestions, and return them so the caller can show "contact
 * these people before listing publicly."
 */
export async function findMatchesForInventoryItem(marketplaceItemId: string): Promise<ScoredMatch[]> {
  const item = await marketplaceItemRepository.getByIdOrThrow(marketplaceItemId);
  const candidates = await marketplaceInterestRepository.findOpenCandidates(item.categoryId);

  const purchaseCounts = await financeRepository.purchaseCountsByContact({
    module: "marketplace",
    contactIds: candidates.map((interest) => interest.contactId),
  });

  const now = new Date();
  const scored: ScoredMatch[] = candidates
    .map((interest) => {
      const scoringContext: ContactScoringContext = {
        lastContactAt: interest.contact.lastContactAt,
        reliabilityScore: interest.contact.marketplaceProfile?.reliabilityScore ?? 50,
        responsivenessScore: interest.contact.marketplaceProfile?.responsivenessScore ?? 50,
        purchaseCount: purchaseCounts.get(interest.contactId) ?? 0,
      };
      const { score, breakdown } = scoreInterest(item, interest, scoringContext, now);
      return { contact: interest.contact, interest, score, breakdown };
    })
    // similarity > 0 is a hard gate, not just part of the weighted score: a contact
    // whose interest shares no category or keyword with this item isn't a "similar
    // products" match no matter how reliable/responsive/recently-contacted they are —
    // without this gate, baseline recency+responsiveness+reliability alone can clear
    // MATCH_SCORE_THRESHOLD for a completely unrelated interest.
    .filter((match) => match.breakdown.similarity > 0 && match.score >= MATCH_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES_PER_ITEM);

  if (scored.length) {
    await marketplaceMatchRepository.upsertMany(
      scored.map((match) => ({
        marketplaceItemId,
        contactId: match.contact.id,
        score: match.score,
        breakdown: match.breakdown as unknown as Prisma.InputJsonValue,
      })),
    );
  }

  return scored;
}

/** Re-exported for callers that just want a quick "$X spent" without a full match. */
export function formatLifetimeSpend(cents: number): string {
  return centsToDollars(cents).toFixed(0);
}
