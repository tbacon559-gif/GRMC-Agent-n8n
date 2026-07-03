# 0002 — Money as integer cents, profit computed not stored

> **Update (Founder OS refactor):** `InventoryItem`/`Customer` are now
> `MarketplaceItem`/`Contact`; `withProfit` lives in
> `src/modules/marketplace/services/marketplace-item.service.ts`. Per-item
> profit is still never stored — see 0011 for how this same "derive, don't
> store what can drift" principle now also applies one level up, to
> cross-module revenue/profit via the `FinanceTransaction` ledger replacing
> `Customer.lifetimeSpendCents`.

## Context

The app tracks acquisition cost, asking price, and sale price per item, plus
lifetime spend per customer. Floating-point dollars accumulate rounding
error across thousands of transactions and comparisons.

## Decision

Every money field is an integer number of cents (`acquisitionCostCents`,
`askingPriceCents`, `salePriceCents`, `lifetimeSpendCents`, `budgetCents`).
`src/lib/money.ts` provides `dollarsToCents`/`centsToDollars`/`formatCents`
for the boundary between this representation and user-facing dollar
strings.

Profit is **not** a stored column on `InventoryItem`. It's always
`salePriceCents - acquisitionCostCents`, computed in
`src/lib/services/inventory.service.ts#withProfit` at read time. A stored
`profitCents` column would need to be kept in sync every time either input
changes (editing acquisition cost after the fact, correcting a sale price)
— computing it on read makes that class of bug impossible.

## Consequences

- All arithmetic on money is exact integer arithmetic.
- API/UI layers must remember to run values through `formatCents` — enforced
  by convention, not the type system, since Prisma can't distinguish "cents"
  from "an int" at the type level.
- Postgres migration is unaffected — integers stay integers.
