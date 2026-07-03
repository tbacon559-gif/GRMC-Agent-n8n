# System Architecture

## High-level diagram

```
                              ┌─────────────────────────────┐
                              │           Taylor OS          │
                              │   (umbrella platform brand)  │
                              └───────────────┬──────────────┘
                                               │
        ┌───────────────┬──────────────────┬─┴────────────────┬───────────────┐
        │                │                  │                  │
        ▼                ▼                  ▼                  ▼
   ┌─────────┐     ┌───────────────┐  ┌───────────┐      ┌────────────┐
   │  Helm   │     │ Marketplace OS │  │ Church OS │      │ Creator OS │
   │(exec    │     │ (~70% built,   │  │ (stub only│      │ (stub only,│
   │dashboard│     │ src/modules/   │  │ in-repo;  │      │ in-repo;   │
   │agg. only│     │ marketplace)   │  │ real logic│      │ real logic │
   │no biz   │     │                │  │ lives in  │      │ lives in   │
   │logic)   │     │                │  │ live n8n) │      │ live n8n)  │
   └────┬────┘     └───────┬────────┘  └─────┬─────┘      └─────┬──────┘
        │                  │                 │                  │
        └──────────────────┴────────┬────────┴──────────────────┘
                                     ▼
                    ┌────────────────────────────────────┐
                    │         Shared Services (Core)       │
                    │        src/core/{repositories,       │
                    │        services,ai,modules,          │
                    │        validation,constants}         │
                    │                                       │
                    │  Contacts · Tasks · Calendar ·        │
                    │  Documents · AI Memory · Finance ·    │
                    │  Notifications                        │
                    │  (see 06-database-schema.md for the   │
                    │   gaps vs. the full Shared Services   │
                    │   list — Auth, Files, Search,         │
                    │   Reporting, Email/SMS, Templates,    │
                    │   Analytics, Audit Logs, Settings)    │
                    └───────────────────┬──────────────────┘
                                         │
                                    PostgreSQL (Neon)
                                (prisma/schema.prisma)

    ═══════════════════════════════════════════════════════════════════
    External, separately-deployed system (NOT this repo):

    ┌────────────────────────────────────────────────────────────┐
    │  n8n instance — ~32 workflows (see 03-workflow-dependency-  │
    │  map.md), running Church guest/formation/membership/social  │
    │  pipelines against Breeze/Sheets/Gmail, and one Creator      │
    │  pipeline (Neon Hours/YouTube). Talks to Taylor OS through   │
    │  exactly ONE frozen contract:                                │
    │                                                               │
    │        POST /api/webhooks/n8n  ──────────────────────────►   │
    │        (docs/decisions/0008, 0013 — path + field names       │
    │         must never change without a versioned migration)     │
    └────────────────────────────────────────────────────────────┘
```

## Key architectural facts

- **Helm has no business logic.** It aggregates `ModuleManifest.dashboardWidget()`
  and `briefingContributor()` output from the other three OSes (the same
  composition pattern `src/core/services/dashboard.service.ts` and
  `briefing.service.ts` already use for the Core dashboard/briefing
  today) — it does not own its own tables beyond what's needed for
  presentation state (e.g. saved priorities, weekly-review notes).
- **Every OS is a module in one codebase today, not a microservice.**
  The module-manifest/registry pattern (`src/core/modules/registry.ts`,
  `docs/decisions/0010-module-manifest-and-registry.md`) is *build-time*
  composition — one Next.js app, one Postgres database — chosen
  deliberately over a premature microservice split. The manifest
  boundary (`dashboardWidget`, `assistantTools`, `briefingContributor`,
  `getContactSummary`) is the seam an OS would be extracted along if it
  ever needs to become a standalone service — see
  `docs/decisions/0010` for the honest limits of this approach today.
- **n8n is architecturally external, not a subsystem of this app.** The
  only two things this repo currently knows about the live n8n fleet
  are: (1) the one frozen webhook contract, and (2) one example workflow
  JSON checked in for reference (`n8n/workflows/messenger-conversation-ingest.json`).
  The other ~32 live workflows run Church's and Creator's actual
  day-to-day operations with **no connection to this app's database or
  AI assistant at all** — see `02-data-flow.md` for why this is the
  single biggest architectural gap found in this audit.
- **Breeze is the source of truth for Church people data**, per the
  product charter — today that relationship exists only inside n8n
  (`Breeze Directory Cache`, `Breeze People Search` workflows, a Breeze
  API credential) and has no equivalent in `prisma/schema.prisma` or
  `src/modules/church-projects`.
- **Auth is a single shared password, not per-OS or per-user.**
  `src/middleware.ts` gates the whole app behind one `SITE_PASSWORD`
  HTTP Basic Auth check. There is no Authentication or User Management
  shared service yet in the sense the product charter calls for — see
  `06-database-schema.md` and `10-implementation-phases.md`.
