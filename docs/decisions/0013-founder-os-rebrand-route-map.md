# 0013 — Founder OS rebrand: route map, what changed and what didn't

## Context

The project pivoted from a single-purpose "Marketplace CRM" to Founder OS,
with Marketplace becoming the first of several modules on a shared Core.
This ADR is the definitive old→new map for anyone (or any external system)
that held a reference to the old routes.

## Decision

| Old | New | Why |
|---|---|---|
| `/customers`, `/customers/[id]` | `/contacts`, `/contacts/[id]` | Contacts are now universal, not Marketplace-specific |
| `/inventory`, `/inventory/[id]` | `/marketplace`, `/marketplace/[id]` | Inventory is Marketplace-module-specific |
| `/api/customers*` | `/api/contacts*` | matches page rename |
| `/api/inventory*`, `/api/categories`, `/api/conversations` | `/api/marketplace/items*`, `/api/marketplace/categories`, `/api/marketplace/conversations` | moved under the module's own namespace |
| `/api/reminders*` | `/api/tasks*` | `FollowUpReminder` generalized into the universal `Task` |
| (none) | `/tasks`, `/lawn-care`, `/publishing`, `/game-studio`, `/ai-products`, `/church-projects` | new Core page + 5 new stub module pages |
| (none) | `/api/finance/summary`, `/api/briefing` | new Core Finance and AI Chief of Staff endpoints |
| `/api/tags`, `/api/dashboard`, `/api/assistant`, `/api/health` | unchanged | already Core-generic, no rename needed |
| `POST /api/webhooks/n8n` | **unchanged** | see below |

**Deliberately not renamed:** `POST /api/webhooks/n8n` and its request body
field names (`messengerThreadId`, `customerName`, `facebookProfileUrl`,
`rawText`, `occurredAt`) are kept exactly as-is. This is a real external
contract — `n8n/workflows/messenger-conversation-ingest.json` hardcodes both
the path and the field names (see 0008) — and nothing about the Founder OS
refactor requires breaking it. The webhook still creates/finds a Core
`Contact` (previously a `Customer`) and still runs the Marketplace
conversation-ingestion pipeline; only the internal wiring changed, not the
contract a seller's existing n8n workflow depends on.

## Consequences

- Any bookmark, script, or external integration pointed at the old
  `/customers`, `/inventory`, `/api/customers*`, `/api/inventory*`,
  `/api/categories`, `/api/conversations`, or `/api/reminders*` paths will
  404 after this deploy — there is no redirect layer, since this was a
  fresh-schema rewrite with no production traffic to preserve compatibility
  for (see the "fresh schema, reseed" scoping decision for this pass).
- The one path that *does* need to keep working without warning,
  `/api/webhooks/n8n`, was identified and explicitly preserved rather than
  swept up in the rename by mechanical find-and-replace.
