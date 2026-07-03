# 0001 — Repository pattern between routes and Prisma

## Context

Every entity (customers, inventory, conversations, interests, reminders,
matches, tags, categories) needs CRUD plus a few domain-specific queries.
Route handlers could call `prisma.*` directly, which is less code short-term
but scatters query logic across the API surface and makes it hard to change
how data is fetched later (e.g. adding caching, or swapping SQLite for
Postgres-specific query optimizations).

## Decision

Every model gets a thin repository module under `src/lib/repositories/`
(`customer.repository.ts`, `inventory.repository.ts`, ...) that wraps
Prisma calls behind plain async functions. Repositories:

- Are the only files that import `prisma` directly for that model.
- Return Prisma's native types (no custom DTO mapping) — there's no need to
  hide Prisma's shape when it already matches what routes and UI need.
- Own field-name/relation-shape decisions (e.g. which relations to
  `include`) so that's decided once, not per call site.

Business logic that spans multiple repositories (the matching engine,
conversation ingestion, dashboard aggregation) lives one layer up in
`src/lib/services/`, which composes repositories rather than duplicating
their queries.

## Consequences

- Route handlers stay thin: parse input, call a repository or service,
  shape the response.
- Swapping the ORM or adding a cache later touches one file per entity, not
  every route.
- It's an extra layer for what are sometimes one-line Prisma calls — worth
  it here because the matching engine, conversation ingestion, and
  dashboard all reuse the same queries from multiple call sites (API routes
  and server-rendered pages).
