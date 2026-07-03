# Taylor OS — Architecture Documentation Index

This is Planning Milestone 1 for Taylor OS: the required pre-implementation
documentation suite, written against the **real, audited state** of this
repository and the live n8n automation fleet as of 2026-07-03 — not a
greenfield design. See `docs/decisions/0015-taylor-os-rebrand-and-helm-naming.md`
for the naming decision this whole suite builds on.

**Scope of this milestone: documentation only.** No code, routes, schema,
or n8n workflows were changed to produce these docs. See
`10-implementation-phases.md` for what happens next, pending approval.

## The four operating systems

| Name | Status today | Owns |
|---|---|---|
| **Helm** | Not started (exec dashboard concept exists informally as n8n "FleetDeck/Steeple" readers) | Aggregation only — no business logic |
| **Marketplace OS** | ~70% built (`src/modules/marketplace`) | Facebook Marketplace reseller CRM, AI pricing/listing, matching engine |
| **Church OS** | Stub only in code; richest logic lives in a live, disconnected n8n pipeline | People/guests/membership/care/facilities/comms, Breeze as source of truth |
| **Creator OS** | Stub only in code; one live n8n pipeline (Neon Hours/YouTube) | Video game dev, publishing, Substack, courses, content calendar |

All four consume, and never duplicate, Shared Services — currently the
Core layer at `src/core/*` (Contacts, Tasks, Calendar, Documents, AI
Memory, Finance, Notifications), with gaps noted in the docs below.

## Reading order

1. [`07-folder-structure.md`](./07-folder-structure.md),
   [`08-coding-standards.md`](./08-coding-standards.md),
   [`09-naming-conventions.md`](./09-naming-conventions.md) — ground rules
   the rest of this suite assumes.
2. [`01-system-architecture.md`](./01-system-architecture.md),
   [`02-data-flow.md`](./02-data-flow.md) — the big picture and how data
   actually moves today.
3. [`03-workflow-dependency-map.md`](./03-workflow-dependency-map.md),
   [`04-api-inventory.md`](./04-api-inventory.md),
   [`05-ai-agent-inventory.md`](./05-ai-agent-inventory.md),
   [`06-database-schema.md`](./06-database-schema.md) — the detailed,
   audited inventories.
4. [`10-implementation-phases.md`](./10-implementation-phases.md) — the
   roadmap, synthesizing everything above.

## Related

- `docs/decisions/` — ADRs (why we chose X; append-only history).
- `docs/ops/` — living operational docs (prompt library, workflow
  catalog, AI agent catalog, deployment guide, ops manual,
  troubleshooting, changelog). Scaffolded as stubs this pass; populated
  once the OSes referenced actually exist.
