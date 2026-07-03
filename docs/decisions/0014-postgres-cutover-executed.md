# 0014 — Postgres cutover executed: Neon, adapter-pg, and the local/test workflow change

## Context

0007 designed the schema to be provider-portable from day one and described
what a Postgres cutover would require, as a hypothetical future move. This
ADR records that the cutover actually happened, ahead of deploying to
Vercel, and the operational fallout 0007 didn't need to cover when it was
still just a plan.

## Decision

- `schema.prisma`'s `datasource` provider is now `postgresql`, targeting
  Neon (chosen for its native Vercel dashboard integration — provision a
  database from the project's **Storage** tab and the connection string is
  wired into your Vercel env vars automatically).
- The prior SQLite migration history
  (`prisma/migrations/20260703154832_founder_os_core/`) was deleted and
  replaced with a fresh initial migration, generated via
  `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`
  (no live database needed to generate it). Postgres and SQLite migration
  SQL aren't interchangeable, so there's no "upgrade path" between the two
  histories — this is a hard reset, acceptable only because there was no
  production data yet to preserve.
- `src/lib/db/prisma.ts` swapped `@prisma/adapter-better-sqlite3` for
  `@prisma/adapter-pg` (a plain `pg` TCP client) rather than
  `@prisma/adapter-neon` (Neon's own WebSocket-based driver). `adapter-pg`
  needs no Node-runtime WebSocket polyfill, and Neon's own **pooled
  connection** string (labeled as such in the Neon/Vercel dashboard —
  PgBouncer-compatible pooling) already solves the problem
  `adapter-neon` exists for: a serverless function opening one connection
  per invocation would otherwise exhaust Postgres's connection limit under
  load. Solving that at the connection-string level, rather than by
  adopting a Neon-specific driver, keeps the app portable to any Postgres
  provider that offers pooling (which most do).
- **Local dev and tests now require a real Postgres connection — a genuine
  workflow change**, not just a production concern:
  - `DATABASE_URL` (dev) should point at a Neon branch — a free-tier "dev"
    branch works well, since Neon branches are cheap and instant to create.
  - `TEST_DATABASE_URL` must be a **separate** database/branch, because
    `vitest.global-setup.ts` runs `DROP SCHEMA public CASCADE` before every
    test run. Pointing it at the same database as real dev data would
    destroy that data on the next `npm test`. Both `vitest.config.ts` and
    `vitest.global-setup.ts` throw immediately if `TEST_DATABASE_URL` is
    unset, rather than silently falling back to `DATABASE_URL`.
- CI (`.github/workflows/ci.yml`) runs a `postgres:16` service container
  instead of pointing at a SQLite file. `DATABASE_URL` and
  `TEST_DATABASE_URL` both point at that container in CI — safe there only
  because the container is destroyed after every job run, so there's no
  persistent "real" data the shared value could put at risk.

## Consequences

- The zero-external-dependency local dev/test story SQLite gave the app for
  free is gone. This is a deliberate trade for running the same database
  engine in dev and production, made worthwhile by Neon's free-tier
  branching — a "dev" branch and a "test" branch cost nothing and need no
  local install (no Docker, no local Postgres binary).
- Anyone working on this repo now needs a `DATABASE_URL` and a distinct
  `TEST_DATABASE_URL` pointing at real Postgres databases before
  `npm run dev` or `npm test` will do anything — see the README "Getting
  started" section and `.env.example`.
- No application code outside `prisma/schema.prisma` and
  `src/lib/db/prisma.ts` needed to change for this cutover — every
  repository, service, and route was already provider-agnostic Prisma
  Client calls. This confirms the portability 0007 designed for actually
  held up in practice, not just in theory.
- Deploying to a serverless platform (Vercel) means `next build` does not
  run database migrations — `prisma migrate deploy` must be run separately
  against the target database (once before the first deploy, and again
  after any PR that adds a migration). See the README "Deploying" section.
