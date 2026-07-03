# 0011 — Finance ledger over denormalized counters

## Context

Before this refactor, `Customer.totalPurchases`/`lifetimeSpendCents` were
integer counters incremented ad hoc in `customerRepository.recordPurchase`
every time a sale was recorded. This is exactly the anti-pattern 0002
already rejected for per-item profit ("derive at read time, don't store
what can drift") — applied one level up. It also can't answer questions the
Founder OS vision explicitly requires: "revenue by module," "revenue over
time," or "lifetime customer value" across *multiple* businesses a contact
might belong to. A counter has no time dimension and no module dimension.

## Decision

`FinanceTransaction` (`prisma/schema.prisma`) is the single source of truth
for money moving in or out, across every module: `type` (income/expense),
`amountCents`, `category?`, `module?` (null = founder-level, e.g. a software
subscription not attributable to one business), `contactId?`,
`description?`, `occurredAt`, `recurring` (manually flagged — no
scheduling/recurrence engine). `src/core/services/finance.service.ts`
computes every aggregate the app needs at read time:
`getFinanceSummary(now)` returns all-time and this-month
income/expense/profit, plus a per-module breakdown, by calling
`financeRepository.summary({ module, from, to })` — a straightforward
`aggregate({ _sum: { amountCents } })` per type, never a stored total.

Marketplace's `recordMarketplaceSale`
(`src/modules/marketplace/services/marketplace-item.service.ts`) writes an
`income` transaction on sale and an `expense` transaction on acquisition
cost (if provided) — replacing the old direct counter increments. The
matching engine's `buyingHistoryScore` (0004) now reads a `purchaseCount`
computed via `financeRepository.purchaseCountsByContact({ module,
contactIds })`, a single batched `groupBy` call across all candidates in one
query rather than reading a per-row counter — avoiding the N+1 that a naive
per-candidate lookup would introduce.

## Consequences

- Every module gets revenue tracking for free by writing to
  `financeRepository.create()` — no module needs its own money-counter
  columns.
- "Revenue by module" and "revenue over time" become simple, always-correct
  `groupBy`/`aggregate` queries instead of features that were structurally
  impossible before.
- One more join/aggregate at read time than a denormalized counter — a
  non-issue at MVP scale, and the same trade 0002 already made for per-item
  profit.
