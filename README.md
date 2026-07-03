# Marketplace CRM

An AI-powered CRM built for Facebook Marketplace resellers. It remembers
every customer, every conversation, and every item someone wanted — and
tells you who to contact the moment new inventory comes in.

## Tech stack

TypeScript · Next.js (App Router) · Tailwind CSS · Prisma ORM · SQLite (dev)
· Claude API (`@anthropic-ai/sdk`) · n8n (Messenger automation) · Vitest

## Getting started

```bash
npm install               # runs `prisma generate` via postinstall
cp .env.example .env      # then fill in ANTHROPIC_API_KEY if you want AI features
npm run db:migrate        # applies prisma/migrations to prisma/dev.db
npm run db:seed           # loads realistic sample data
npm run dev                # http://localhost:3000
```

`ANTHROPIC_API_KEY` is optional. Everything except conversation extraction
and the AI assistant works without it; those two return a `503` with a
clear message if it's missing.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` / `test:watch` | Vitest (unit + one DB-integration file) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample customers/inventory/conversations |
| `npm run db:studio` | Prisma Studio (browse the DB) |
| `npm run db:reset` | Drop, re-migrate, and re-seed |

## How the spec maps to the code

| Spec feature | Where |
|---|---|
| Customer CRM | `prisma/schema.prisma#Customer`, `src/lib/repositories/customer.repository.ts`, `/customers` |
| Inventory tracking, profit | `InventoryItem` model, `src/lib/services/inventory.service.ts` (profit computed at read time, never stored) |
| Conversation intelligence | `src/lib/ai/extraction.ts` (Claude structured output) + `src/lib/services/conversation.service.ts` |
| Matching engine | `src/lib/services/matching.service.ts` — runs automatically on `POST /api/inventory` |
| Dashboard | `src/lib/services/dashboard.service.ts`, `src/app/page.tsx` |
| AI assistant (NL Q&A) | `src/lib/ai/assistant.ts` (Claude tool-use over `src/lib/services/analytics.service.ts`), `/assistant` |
| n8n integration | `POST /api/webhooks/n8n`, example workflow in `n8n/workflows/` |

## Architecture

```
route handlers (src/app/api/**)     server components (src/app/**/page.tsx)
              \                              /
               services (src/lib/services/*)      <- business logic, AI orchestration
                              |
              repositories (src/lib/repositories/*) <- the only files that import prisma
                              |
                    prisma (src/lib/db/prisma.ts)
                              |
                  SQLite (dev) — swappable for Postgres, see docs/decisions/0007
```

Every non-obvious decision — why no native enums, why money is integer
cents, why the matching engine gates on similarity before ranking, why the
AI assistant only gets tool-use access instead of generating SQL, how a
Postgres migration would work — is written up in `docs/decisions/`.

## Testing

```bash
npm test
```

Runs Vitest: pure unit tests for the matching engine's scoring math, the
similarity helpers, money formatting, and the AI extraction schema, plus
one integration test file (`matching.integration.test.ts`) that exercises
the repository + matching-engine layers against a real throwaway SQLite
database (`prisma/test.db`, created fresh by `vitest.global-setup.ts` and
deleted after). That integration test is what caught a real bug during
development — see `docs/decisions/0004-matching-engine-design.md`.

## Project structure

```
prisma/schema.prisma       Data model (see docs/decisions/0002, 0003)
prisma/seed.ts             Sample data
src/lib/constants/enums.ts Single source of truth for status/enum values
src/lib/validation/*       Zod schemas (API input + AI extraction contract)
src/lib/repositories/*     Prisma queries, one module per model
src/lib/services/*         Business logic: matching, inventory, conversation
                            ingestion, dashboard aggregation, analytics
src/lib/ai/*               Claude client, extraction, assistant tool-use loop
src/app/api/**             Route handlers
src/app/**/page.tsx        Dashboard, customers, inventory, assistant UI
src/components/*           Shared UI + client-side forms
docs/decisions/*           Architecture decision records
n8n/workflows/*            Example n8n workflow for the Messenger webhook
```

## Roadmap beyond the MVP

- Wire `Customer.responsivenessScore` up to real Messenger response-time
  data instead of a manually-adjusted default.
- Synthesize `Customer.aiSummary` across conversation history instead of
  overwriting it with the latest conversation's summary.
- Move interest/inventory keywords into a normalized join table if the
  open-interest backlog grows large enough that in-process keyword scoring
  becomes a bottleneck (see `docs/decisions/0004`).
