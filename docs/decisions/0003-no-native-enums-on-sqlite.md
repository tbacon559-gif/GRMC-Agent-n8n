# 0003 — No native Prisma enums; validated string unions instead

## Context

The spec calls for several enum-like fields: customer status, inventory
status, urgency, buying intent, sentiment, interest/reminder/match status.
Prisma's `enum` schema type is natively supported on PostgreSQL, MySQL, and
CockroachDB — **but not on SQLite** (or SQL Server), which is the required
dev datasource. Declaring a Prisma `enum` with `provider = "sqlite"` fails
schema validation outright.

## Decision

Every enum-like column is a plain `String` in `schema.prisma`. The
allowed values live in exactly one place, `src/lib/constants/enums.ts`, as
`as const` string-array tuples with a derived TypeScript union type per
field (`CustomerStatus`, `InventoryStatus`, `Urgency`, ...). Zod schemas in
`src/lib/validation/*.ts` build their `z.enum(...)` calls directly from
these arrays, so the database, the TypeScript types, and the request
validation can never drift out of sync with each other.

## Consequences

- The schema is provider-portable: switching `datasource.provider` to
  `postgresql` requires no column-type changes. (Optionally, once on
  Postgres, these columns could be converted to native enums for stricter
  DB-level validation — not required, since Zod already validates every
  write path.)
- SQLite offers no DB-level constraint preventing an invalid string from
  being written outside the app (e.g. a manual `INSERT`). Acceptable for an
  MVP where all writes go through the validated API/service layer.
