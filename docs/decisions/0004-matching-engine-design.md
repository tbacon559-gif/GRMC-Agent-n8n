# 0004 — Matching engine: deterministic scoring, not a per-match AI call

> **Update (Founder OS refactor):** this file now lives at
> `src/modules/marketplace/services/matching.service.ts`. `scoreInterest`'s
> signature changed from `(item, interest, customer, now)` to
> `(item, interest, scoringContext, now)` — `customer.totalPurchases` no
> longer exists (see 0011); `buyingHistory` is now computed from a
> `purchaseCount` passed in via a plain `ContactScoringContext` object,
> batch-fetched from the Finance ledger. `responsiveness`/`reliability` now
> come from `MarketplaceProfile`, not `Contact` (see 0012). The scoring
> formula, weights, and the "similarity > 0 is a hard gate" reasoning below
> are otherwise unchanged.

## Context

The core spec feature: whenever inventory is added, find every customer
with a similar open interest and rank who to contact first, by similarity,
buying history, recency, responsiveness, and reliability.

## Decision

`src/lib/services/matching.service.ts` scores candidates with a fixed,
explainable formula rather than asking Claude to rank matches:

```
score = similarity      * 0.35
      + buyingHistory    * 0.15
      + recency          * 0.20
      + responsiveness   * 0.15
      + reliability      * 0.15
```

- **similarity**: category match (base 60) plus a Jaccard-similarity bonus
  on keyword sets (`src/lib/services/similarity.ts`). This is a hard gate,
  not just a weight — a candidate with `similarity === 0` is excluded
  outright, no matter how good their other scores are. An integration test
  caught exactly this failure mode: a customer with a completely unrelated
  interest cleared the weighted threshold on baseline
  recency/responsiveness/reliability alone. "Find customers interested in
  similar products" requires an actual product-relevance signal first.
- **buyingHistory**: linear in `customer.totalPurchases`.
- **recency**: exponential decay (`recencyScore`) blending how recently the
  customer was last contacted and how recently they expressed the interest.
- **responsiveness** / **reliability**: read directly off the `Customer`
  row (see 0004a below on how these are seeded/maintained).

Every score comes with a `reasons: string[]` breakdown persisted alongside
it, so the UI can show *why* a match was suggested, not just a number.

Deterministic scoring (rather than an LLM call per candidate) was chosen
because: it's free and instant even with thousands of open interests, it's
testable with plain unit tests (`matching.service.test.ts`), and its
behavior is auditable — a seller can see exactly why someone was or wasn't
suggested. Claude is used elsewhere (extraction, the assistant) precisely
where free-form language understanding is the actual job.

## Candidate selection and scale

`interestRepository.findOpenCandidates(categoryId)` narrows to open
interests in the same category (plus uncategorized interests, which can
still match via keyword overlap) — an indexed DB filter. Keyword-level
similarity scoring then happens in-process on that narrowed set, because
Prisma's JSON filtering isn't available on SQLite (only Postgres/MySQL/
CockroachDB). This is fine at MVP scale (hundreds to low thousands of open
interests). If the open-interest backlog grows large enough that
in-process scoring becomes a bottleneck, the fix is to normalize keywords
into an `InterestKeyword` join table for indexed lookups — not a schema
rewrite, an additive change.

## Consequences

- Match suggestions are persisted (`MatchSuggestion`, upserted on
  `[inventoryItemId, customerId]`) so re-running the engine for the same
  item updates scores instead of duplicating rows, and the dashboard/UI
  don't need to recompute on every read.
- `responsivenessScore` currently has no automatic input — it starts
  neutral (50) and is only adjusted manually today. Wiring it up to real
  Messenger response-time data (via the n8n integration) is a natural
  follow-up, not required for the MVP's matching logic to work correctly.
