# Folder Structure

## Current tree (this repo)

```
src/
  core/                        Shared Services layer (see 09-naming-conventions.md)
    repositories/              Contact, Tag, Note, Task, Finance, Memory, Calendar, Document, Notification
    services/                  dashboard.service.ts, briefing.service.ts, finance.service.ts
    ai/                        client.ts (Claude), tool.ts (tool-def helper), assistant.ts (cross-module loop)
    modules/                   types.ts (ModuleManifest), registry.ts (the MODULES array)
    validation/                Zod schemas for Core
    constants/                 enums.ts — single source of truth for Core status/enum values

  modules/
    marketplace/                Flagship module (Marketplace OS) — full depth
      repositories/ services/ ai/ validation/ components/
    lawn-care/                  Stub module
    publishing/                 Stub module (Creator OS candidate)
    game-studio/                Stub module (Creator OS candidate)
    ai-products/                Stub module (Creator OS candidate)
    church-projects/            Stub module (Church OS candidate) — bare CRUD, no Breeze/volunteers/care depth

  lib/                         Module-agnostic infra: db client, env, errors, money helpers
  app/api/**                   Route handlers (see 04-api-inventory.md)
  app/**/page.tsx              Server components (dashboard, contacts, tasks, marketplace, stub pages, assistant UI)
  components/                  Shared UI + Core client-side forms
  generated/prisma/            Prisma client output

prisma/                        schema.prisma, migrations/, seed.ts
n8n/workflows/                 One in-repo example (messenger-conversation-ingest.json) — the other ~32
                                workflows this platform depends on live in a separate n8n instance, not
                                this repo (see 02-data-flow.md, 03-workflow-dependency-map.md)
docs/
  decisions/                   ADRs — why we chose X (append-only)
  architecture/                This suite — point-in-time design docs
  ops/                         Living operational docs (stubbed this pass)
```

## The hard rule

A module (`src/modules/<name>/*`) never imports another module's
internals — only Core (`src/core/*`). Cross-module composition happens
through the `ModuleManifest` contract (`src/core/modules/types.ts`):
`dashboardWidget()`, `assistantTools()`, `briefingContributor()`,
`getContactSummary()`. This is what lets each OS eventually become a
standalone microservice/SaaS product without a rewrite: the manifest
boundary is already the seam a module would be cut along.

`prisma/schema.prisma` follows the same rule at the data layer — Core
never holds a typed relation *into* a module's tables, only the reverse
(a module's extension table FKs back to `Contact`). See
`docs/decisions/0012-core-module-schema-boundary.md` and
`06-database-schema.md`.

## Target structure for the four OSes (not yet built)

Adding depth to Church OS or Creator OS follows the exact same pattern
Marketplace already demonstrates — no new top-level convention is
needed:

```
src/modules/church/                 (rename target for church-projects — see 10-implementation-phases.md)
  repositories/                     Guest, FormationStage, MembershipCohort, VolunteerAssignment, PastoralVisit
  services/                         Breeze sync, care pipeline, facilities/maintenance
  ai/                               Care Assistant, Guest Follow-up, Communications Director prompts
  validation/
  components/

src/modules/creator/                (rename/merge target for publishing + game-studio + ai-products)
  repositories/                     ContentCalendar, revenue tracking
  services/
  ai/                               Content Strategist, Writing Assistant, Marketing Assistant prompts
  validation/
  components/
```

`src/helm/` (or a `src/app/helm/` route + a thin `src/core/services/helm.service.ts`)
is the natural home for the executive dashboard once built — it composes
existing `ModuleManifest.dashboardWidget()`/`briefingContributor()` hooks
across all four OSes rather than owning new business-logic tables.
