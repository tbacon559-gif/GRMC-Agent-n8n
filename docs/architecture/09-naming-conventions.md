# Naming Conventions

Canonical, going forward (see `docs/decisions/0015-taylor-os-rebrand-and-helm-naming.md`
for how these were decided):

## Product names

| Name | Refers to |
|---|---|
| **Taylor OS** | The umbrella platform — all four OSes plus Shared Services |
| **Helm** | The executive-dashboard OS (aggregation only, no business logic) |
| **Marketplace OS** | The Facebook Marketplace reseller module (`src/modules/marketplace`) |
| **Church OS** | The church-administration module (today: `src/modules/church-projects`, a stub) |
| **Creator OS** | The creative-businesses module (today: `publishing`/`game-studio`/`ai-products` stubs) |
| Founder OS | **Legacy term.** The platform's name before this rename; still literally present in `package.json`, README, and route history until a dedicated rename pass (see `10-implementation-phases.md`). Do not use it in new docs. |

Do not use "Taylor OS" to mean the executive dashboard specifically — use
"Helm."

## Module `id` conventions (`src/core/modules/types.ts` / `registry.ts`)

- `id` is a kebab-case string matching the module's directory name under
  `src/modules/` (e.g. `"marketplace"`, `"church-projects"`).
- `MODULE_IDS` in `src/core/constants/enums.ts` is the single source of
  truth for valid `module` values stored on Core rows (`Task.module`,
  `FinanceTransaction.module`, etc.) — any new module's `id` must be
  added there.
- A module's own status/enum-like `String` fields live in that module's
  own `constants/enums.ts`, never in Core's.

## Route conventions (per `docs/decisions/0013-founder-os-rebrand-route-map.md`)

- Core-generic routes are unprefixed: `/contacts`, `/tasks`,
  `/api/contacts`, `/api/tasks`, `/api/tags`, `/api/dashboard`,
  `/api/assistant`, `/api/briefing`, `/api/finance/summary`,
  `/api/health`.
- Module-specific routes live under the module's own namespace:
  `/marketplace`, `/api/marketplace/items`,
  `/api/marketplace/conversations`, etc. Church OS and Creator OS
  routes should follow the same shape once built:
  `/church`, `/api/church/<resource>`; `/creator`, `/api/creator/<resource>`.
- Exactly one route is a frozen external contract and must never be
  renamed by convention-cleanup: `POST /api/webhooks/n8n`, including its
  body field names (`messengerThreadId`, `customerName`,
  `facebookProfileUrl`, `rawText`, `occurredAt`) — see
  `docs/decisions/0008-n8n-webhook-contract.md`.

## File naming

- `*.repository.ts`, `*.service.ts`, `*.manifest.ts` — one concept per
  file, suffix states the layer.
- `*.test.ts` — colocated unit tests; `*.integration.test.ts` — colocated
  integration tests against `TEST_DATABASE_URL`.
- `enums.ts` — one per layer (Core, each module) for validated
  "enum-like" string values (see `08-coding-standards.md` item 3).

## n8n workflow naming (external instance — see `03-workflow-dependency-map.md`)

The audited fleet has inconsistent naming today (`"GRMC - Inbox
Auto-Archive"` vs. `"GRMC Inbox Auto-Archive"` as literally different
workflows) and at least one workflow left with a stale temporary name
(`"...TEMP AUTO-SEND thru 6/27"` still live past its own expiry date).
Going forward, any n8n workflow that is a permanent part of an OS's
pipeline should be named `<OS prefix> — <purpose>` (e.g. `"Church —
Guest Reconciliation"`), with no punctuation-only variants of the same
name coexisting, and no "TEMP"/date-boxed names left active past their
stated window — this is a process rule, not a naming-scheme change, and
is called out again as a fix item in `10-implementation-phases.md`.
