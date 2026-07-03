# Database Schema

## Current schema (`prisma/schema.prisma`, PostgreSQL/Neon)

**Core (10 models):** `Founder` (single seeded row, not yet FK'd anywhere
— multi-user auth can be bolted on later via `founderId` columns without
a schema rewrite), `Contact` (the universal person record — one row per
person across all OSes), `Tag`, `ContactTag`, `Note`, `Task`
(founder/module/contact-scoped), `FinanceTransaction` (the money ledger,
`docs/decisions/0011`), `ContactMemoryEntry` (append-only AI memory,
`docs/decisions/0009`), `CalendarEvent`, `Document`, `Notification`.

**Marketplace OS (6 models, full depth):** `MarketplaceProfile`,
`MarketplaceCategory`, `MarketplaceItem`, `MarketplaceConversation`,
`MarketplaceInterest`, `MarketplaceMatch`.

**Stub modules (5 models, bare CRUD, one table each):**
`LawnCareClient`, `PublishingProject`, `GameStudioProject`,
`AiProductProject`, `ChurchProject`.

All module tables FK back to `Contact` — never the reverse in a typed
way beyond the required back-relation fields Prisma's single-schema-file
rules force (`docs/decisions/0012-core-module-schema-boundary.md`).

## Reconciling against the four-OS target

- **Marketplace OS** — schema already matches the charter's feature list
  reasonably well (intake via `MarketplaceConversation`, inventory via
  `MarketplaceItem`, profit derived at read time). Missing: eBay-specific
  fields (a second `marketplaceUrl`-like field or a `platform` enum-like
  string), shipping/pickup-scheduling tables, and a migration path for
  the external `TR Flips Ledger`/`TR Flips Subscribers` n8n data tables
  (see `03-workflow-dependency-map.md`).
- **Church OS** — `ChurchProject` covers none of the charter's modules
  (people, guests, membership, volunteers, children, small groups,
  facilities, care, prayer requests, budget, event planning). The live
  n8n data tables (`Guest_Pipeline`, `Membership_Cohort`,
  `Formation_Tracker`, `Touchpoints_Due`) are a ready-made spec for the
  first real Church OS tables:
  - `Guest` (contactId FK, source, first-visit date, status)
  - `FormationStage` (contactId FK, stage, enteredAt — mirrors
    `Formation_Tracker`)
  - `MembershipCohort` (mirrors `Membership_Cohort`)
  - `VolunteerAssignment`, `PastoralVisit`, `PrayerRequest`,
    `FacilityMaintenanceTicket`, `BudgetLineItem` — net-new, from the
    charter's module list, none of which exist in n8n data tables today
  - A `BreezePersonCache` table (or a service-layer cache, not
    necessarily a table) if Breeze data needs local caching for
    performance — the n8n "Breeze Directory Cache" workflow already
    proves this pattern is needed.
- **Creator OS** — no tables today beyond three near-empty stubs
  (`PublishingProject`, `GameStudioProject`, `AiProductProject`). The
  n8n `Neon Schedule`/`Neon Assets` data tables map to a future
  `ContentCalendar` table; charter items with no n8n precursor at all
  (courses, product launches, revenue tracking beyond Core's Finance
  ledger) are fully net-new.
- **Helm** — should need little to no new schema. Its job is aggregation
  over existing/future OS tables via the manifest pattern
  (`dashboardWidget()`, `briefingContributor()`); at most it needs a
  small `HelmPriority`/`WeeklyReviewNote` table for presentation state
  that doesn't belong to any single OS.

## Shared Services gap check

The charter's Shared Services list, checked against what exists:

| Shared service | Exists today? |
|---|---|
| Contacts, Tasks, Calendar, Notifications | Yes — Core models above |
| AI Memory (charter calls this part of Knowledge Base/Personal Knowledge Assistant) | Partially — `ContactMemoryEntry` exists, no synthesis layer |
| Documents / Files | Partially — `Document` model is metadata-only, `url` is a plain string; **no actual file/blob storage is wired up** |
| Authentication, User Management | **No** — one shared `SITE_PASSWORD`, no per-user accounts |
| AI Prompt Library | **No** — see `05-ai-agent-inventory.md` |
| Knowledge Base, Search | **No** |
| Reporting (beyond Finance summary) | **No** |
| Email, SMS | **No** — n8n's Gmail/Telegram credentials cover some of this externally, not as a Taylor OS shared service |
| Templates | **No** |
| Analytics | **No** — beyond ad hoc dashboard stats |
| Audit Logs | **No** — `ContactMemoryEntry`'s append-only pattern is the closest precedent for how an audit log should be modeled |
| Settings | **No** |

This gap list, combined with the OS-specific gaps above, is what
`10-implementation-phases.md` sequences.
