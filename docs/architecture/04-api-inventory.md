# API Inventory

All routes below are under `src/app/api/`. Every route except
`/api/health` and `/api/webhooks/n8n` sits behind the single
`SITE_PASSWORD` HTTP Basic Auth gate in `src/middleware.ts` — there is
**no per-OS or per-user auth yet** (see `01-system-architecture.md` and
`06-database-schema.md`).

| Route | Owner | Purpose | Auth |
|---|---|---|---|
| `GET /api/health` | Core/infra | Liveness check | None (excluded by middleware) |
| `POST /api/webhooks/n8n` | Core → Marketplace | The one frozen external contract — Messenger conversation ingest (see `02-data-flow.md` Flow A). Body: `messengerThreadId`, `customerName`, `facebookProfileUrl`, `rawText`, `occurredAt`. **Do not rename path or fields** (docs/decisions/0008, 0013). | `x-n8n-webhook-secret` header (`N8N_WEBHOOK_SECRET`), excluded from Basic Auth |
| `GET/POST /api/contacts` | Core | Universal person record CRUD | SITE_PASSWORD |
| `GET/PATCH/DELETE /api/contacts/[id]` | Core | Single contact | SITE_PASSWORD |
| `POST /api/contacts/[id]/notes` | Core | Add a freeform note | SITE_PASSWORD |
| `GET/POST /api/tasks` | Core | Universal task system (founder/module/contact scoped) | SITE_PASSWORD |
| `GET/PATCH/DELETE /api/tasks/[id]` | Core | Single task | SITE_PASSWORD |
| `GET/POST /api/tags` | Core | Tag CRUD | SITE_PASSWORD |
| `GET /api/dashboard` | Core | Aggregates every module's `dashboardWidget()` — the direct ancestor of Helm | SITE_PASSWORD |
| `POST /api/briefing` | Core (AI Chief of Staff) | On-demand daily briefing; falls back to a rule-based summary without `ANTHROPIC_API_KEY` | SITE_PASSWORD |
| `POST /api/assistant` | Core (AI assistant) | Cross-module NL Q&A via tool-use; composes Core tools + every module's `assistantTools()` | SITE_PASSWORD |
| `GET /api/finance/summary` | Core (Finance) | Revenue/profit/lifetime-value aggregates, derived at read time from `FinanceTransaction` | SITE_PASSWORD |
| `GET/POST /api/marketplace/items` | Marketplace OS | Inventory CRUD; `POST` triggers the matching engine automatically | SITE_PASSWORD |
| `GET/PATCH/DELETE /api/marketplace/items/[id]` | Marketplace OS | Single item | SITE_PASSWORD |
| `GET /api/marketplace/items/[id]/matches` | Marketplace OS | Matching-engine results for one item | SITE_PASSWORD |
| `POST /api/marketplace/items/[id]/sale` | Marketplace OS | Record a sale | SITE_PASSWORD |
| `GET/POST /api/marketplace/conversations` | Marketplace OS | Ingested conversations + AI extraction results | SITE_PASSWORD |
| `GET/POST /api/marketplace/categories` | Marketplace OS | Category CRUD | SITE_PASSWORD |
| `GET /api/marketplace/profiles/[contactId]` | Marketplace OS | A contact's Marketplace-specific profile (reliability/responsiveness scores) | SITE_PASSWORD |

**Not yet existing** (needed once Church OS / Creator OS / Helm gain real
depth, per `10-implementation-phases.md`):

- `POST /api/webhooks/church` (or `/api/church/*` write endpoints) — the
  closing step for the live Church n8n pipeline described in
  `02-data-flow.md` Flow B.
- `/api/church/*` (guests, formation, membership, care, facilities)
- `/api/creator/*` (content calendar, revenue, launches)
- `/api/helm/*` (priorities, weekly review, personal KPIs) — or Helm may
  need no new API surface at all if it only reads existing
  `dashboardWidget()`/`briefingContributor()` aggregation, per
  `01-system-architecture.md`.
- Any Shared Services not yet split out as their own API surface: Files,
  Search, Reporting, Email, SMS, Templates, Analytics, Audit Logs,
  Settings (see `06-database-schema.md` for the full gap list).
