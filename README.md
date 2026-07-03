# Founder OS

An AI operating system for a solo founder running multiple businesses. One
identity, many business modules — Marketplace (an AI-powered CRM for
Facebook Marketplace resellers) is the first, full-depth module; Lawn Care,
Publishing, Video Game Studio, AI Products, and Church Projects are
scaffolded as thin stubs. Every module shares one Core: Contacts, Tasks,
Calendar, Documents, AI Memory, Finance, and Notifications. A contact —
someone who is simultaneously a Marketplace buyer and a Lawn Care client,
say — never exists twice.

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

`ANTHROPIC_API_KEY` is optional. Everything except conversation extraction,
the AI assistant, and the AI Chief of Staff briefing works without it —
those return a `503` (or, for the briefing, a plain rule-based summary
instead of prose) if it's missing.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` / `test:watch` | Vitest (unit + integration tests) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample contacts/inventory/tasks/finance data |
| `npm run db:studio` | Prisma Studio (browse the DB) |
| `npm run db:reset` | Drop, re-migrate, and re-seed |

## How modules work

Every module — Marketplace included — registers one `ModuleManifest` object
in `src/core/modules/registry.ts`. Core (nav, dashboard, the AI assistant,
the AI Chief of Staff briefing, a contact's "business memberships") never
branches on which module it's talking to; it only iterates `MODULES` and
calls whatever hooks each manifest provides. Adding module #7 means: create
`src/modules/<name>/manifest.ts`, import it in the registry, add one array
entry — no existing file needs to change. See
`docs/decisions/0010-module-manifest-and-registry.md` for the full contract
and its honest limits (this is build-time composition, not a runtime plugin
system).

```ts
// src/modules/<name>/manifest.ts
export const myModule: ModuleManifest = {
  id: "my-module",
  name: "My Module",
  nav: { href: "/my-module", label: "My Module", icon: SomeLucideIcon },
  async dashboardWidget() { /* returns { id, title, stats, items? } */ },
  assistantTools: () => [ /* defineTool({ name, description, schema, run }) */ ],
  async briefingContributor({ now }) { /* returns string[] of facts */ },
  async getContactSummary(contactId) { /* returns { label, detail } | null */ },
};
```

## How the spec maps to the code

| Spec feature | Where |
|---|---|
| Universal Contact (people exist once) | `prisma/schema.prisma#Contact`, `src/core/repositories/contact.repository.ts`, `/contacts` |
| Universal Task system | `Task` model (founder/module/contact scoped), `src/core/repositories/task.repository.ts`, `/tasks` |
| Finance ledger (revenue/profit/lifetime value) | `FinanceTransaction` model, `src/core/services/finance.service.ts`, `/api/finance/summary` |
| AI Memory (never overwrite history) | `ContactMemoryEntry` (append-only), `src/core/repositories/memory.repository.ts` |
| AI Chief of Staff briefing | `src/core/services/briefing.service.ts`, `POST /api/briefing`, on-demand from the dashboard |
| Module manifest + registry | `src/core/modules/{types,registry}.ts` |
| Marketplace: inventory tracking, profit | `MarketplaceItem` model, `src/modules/marketplace/services/marketplace-item.service.ts` (profit computed at read time, never stored) |
| Marketplace: conversation intelligence | `src/modules/marketplace/ai/extraction.ts` (Claude structured output) + `marketplace-conversation.service.ts` |
| Marketplace: matching engine | `src/modules/marketplace/services/matching.service.ts` — runs automatically on `POST /api/marketplace/items` |
| AI assistant (NL Q&A, cross-module) | `src/core/ai/assistant.ts` — Core tools + `MODULES.flatMap(m => m.assistantTools?.())`, `/assistant` |
| n8n integration | `POST /api/webhooks/n8n` (path and body contract unchanged — see `docs/decisions/0013`), example workflow in `n8n/workflows/` |
| Code quality / CI | Repository + service layering, Zod validation everywhere, `.github/workflows/ci.yml` runs typecheck/lint/test/build on every push |

## Architecture

```
route handlers (src/app/api/**)     server components (src/app/**/page.tsx)
              \                              /
               core services (src/core/services/*)  <- cross-module aggregation, AI orchestration
               module services (src/modules/<name>/services/*)  <- module-specific business logic
                              |
    core repositories (src/core/repositories/*)   <- Contact, Task, Finance, Memory, ...
    module repositories (src/modules/<name>/repositories/*)  <- the only files that import prisma for that module
                              |
                    prisma (src/lib/db/prisma.ts)
                              |
                  SQLite (dev) — swappable for Postgres, see docs/decisions/0007
```

Core never holds a typed relation into a module's business logic — only the
reverse (a module's extension table FKs back to `Contact`). See
`docs/decisions/0012-core-module-schema-boundary.md`.

Every non-obvious decision — why no native enums, why money is integer
cents, why AI memory is an append-only log, why there's a Finance ledger
instead of denormalized counters, why the matching engine gates on
similarity before ranking, why the AI assistant only gets tool-use access
instead of generating SQL, how a Postgres migration would work, the full
old→new route map from the Marketplace CRM → Founder OS rebrand — is written
up in `docs/decisions/`.

## Testing

```bash
npm test
```

Runs Vitest: pure unit tests for the matching engine's scoring math, the
similarity helpers, money formatting, and the AI extraction schema, plus
`*.integration.test.ts` files that exercise the repository/service layers
(matching engine, tag attachment, Marketplace sales, conversation ingestion
with the AI call mocked, the append-only memory log, the Finance ledger,
the module registry) against a real throwaway SQLite database
(`prisma/test.db`, created fresh by `vitest.global-setup.ts`). These files
share that one database, so `fileParallelism: false` avoids concurrent
SQLite writers. The matching-engine integration test is what caught a real
bug during development — see `docs/decisions/0004-matching-engine-design.md`.

## Project structure

```
prisma/schema.prisma          Data model: Core + Marketplace + stub modules (see docs/decisions/0002, 0003, 0012)
prisma/seed.ts                Sample data — includes one contact who is both a Marketplace buyer and a Lawn Care client
src/core/constants/enums.ts   Single source of truth for Core status/enum values
src/core/validation/*         Zod schemas for Core (contact, task, assistant)
src/core/repositories/*       Contact, Tag, Note, Task, Finance, Memory, Calendar, Document, Notification
src/core/services/*           Dashboard aggregation, AI Chief of Staff briefing, Finance summary
src/core/ai/*                 Claude client, tool-def helper, cross-module assistant loop
src/core/modules/*            ModuleManifest type + the module registry
src/modules/marketplace/*     The flagship module: repositories, services, AI extraction, validation, components
src/modules/{lawn-care,publishing,game-studio,ai-products,church-projects}/*  Thin stub modules
src/lib/*                     Module-agnostic infra: db client, env, errors, money helpers, API error handler
src/app/api/**                Route handlers
src/app/**/page.tsx           Dashboard, contacts, tasks, marketplace, stub module pages, assistant UI
src/components/*              Shared UI + Core client-side forms
docs/decisions/*              Architecture decision records
n8n/workflows/*                Example n8n workflow for the Messenger webhook
```

## Roadmap beyond this pass

- Synthesize a contact's AI memory across their full `ContactMemoryEntry`
  history into one coherent narrative, instead of `aiSummaryCache` only ever
  reflecting the latest conversation (see `docs/decisions/0009`).
- Wire `MarketplaceProfile.responsivenessScore` up to real Messenger
  response-time data instead of a manually-adjusted default.
- Build out the five stub modules (Lawn Care, Publishing, Video Game Studio,
  AI Products, Church Projects) to full depth, following the same
  repository/service/manifest pattern Marketplace already demonstrates.
- Move interest/inventory keywords into a normalized join table if the
  open-interest backlog grows large enough that in-process keyword scoring
  becomes a bottleneck (see `docs/decisions/0004`).
