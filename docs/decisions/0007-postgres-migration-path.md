# 0007 — SQLite for dev, Postgres/Supabase migration path

> **Update (Founder OS refactor):** everything below still holds — the
> Founder OS schema (Core + every module) was written under the same
> constraints from day one. One addition: Prisma 7's SQLite codegen renders
> `Json @default(...)` as an unquoted (invalid) SQL literal, so every `Json`
> column in the new schema omits `@default` and the owning repository
> supplies an explicit value on `create()` instead — see the comment above
> `Contact.customFields` in `prisma/schema.prisma`.

## Context

The spec requires SQLite for development with a clean path to
PostgreSQL/Supabase in production, without a schema rewrite.

## Decision

Prisma 7 removed the bundled Rust query engine in favor of explicit driver
adapters passed to `new PrismaClient({ adapter })`
(`src/lib/db/prisma.ts`). Today that's `@prisma/adapter-better-sqlite3`.
Moving to Postgres means:

1. `schema.prisma`: change `datasource db { provider = "sqlite" }` to
   `provider = "postgresql"`, then `prisma generate`.
2. `src/lib/db/prisma.ts`: swap `PrismaBetterSqlite3` for
   `@prisma/adapter-pg` (or a Supabase-specific adapter), pointed at the
   Postgres `DATABASE_URL`.
3. Run `prisma migrate deploy` against the new database — the existing
   migration history in `prisma/migrations/` replays cleanly because
   nothing in the schema uses a SQLite-only feature (see 0003 on enums,
   0004/interest-repository on JSON filtering).

Every modeling decision in the schema was made with this move in mind:

- No native `enum` types (unsupported on SQLite) — string unions instead
  (0003), which work identically on Postgres.
- No reliance on Prisma's JSON filtering (`path`/`array_contains`), which
  SQLite doesn't support — keyword matching happens in-process instead
  (0004). This continues to work unchanged on Postgres; it just wouldn't be
  taking advantage of Postgres's native JSON querying, which is a possible
  future optimization, not a blocker.
- No `createMany({ skipDuplicates: true })` (unsupported on SQLite) — used
  per-row `upsert` on composite keys instead (`tag.repository.ts`), which
  is provider-agnostic.
- IDs are `cuid()` strings, not SQLite `rowid` integers, so they're stable
  across a data migration to a different database.

## Consequences

- Zero schema changes needed to move providers — only the two lines above
  plus the adapter package swap.
- A real data migration (copying existing SQLite rows into Postgres) is a
  separate concern from schema portability and isn't addressed here; for
  a fresh Supabase deployment starting empty, `prisma migrate deploy` is
  sufficient.
