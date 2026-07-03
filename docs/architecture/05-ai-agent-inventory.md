# AI Agent Inventory

Mapping real Claude call sites today to the named-agent catalog the
product charter calls for. Most of the charter's agents don't exist yet
— this document exists specifically to make that gap explicit, not to
overstate what's built.

## Helm

| Agent (charter) | Implementation today | Status |
|---|---|---|
| Chief of Staff | `src/core/ai/assistant.ts` + `src/core/services/briefing.service.ts` (`POST /api/assistant`, `POST /api/briefing`) | **Partially implemented** — cross-module tool-use assistant and a daily briefing exist; not yet branded/scoped as "Chief of Staff" specifically |
| Executive Planner | — | **Not implemented** |
| Weekly Review Agent | — | **Not implemented** |
| Personal Knowledge Assistant | `ContactMemoryEntry` (append-only AI memory, `docs/decisions/0009`) is the closest existing substrate | **Not implemented as an agent** — memory storage exists, no synthesis/query agent on top yet (see README "Roadmap beyond this pass": synthesizing memory into one coherent narrative is already a known gap) |

## Marketplace OS

| Agent (charter) | Implementation today | Status |
|---|---|---|
| Pricing Agent | Not a distinct agent; `askingPriceCents` is manually set | **Not implemented** |
| Listing Agent | `src/modules/marketplace/ai/extraction.ts` extracts structured listing-relevant data from conversations, but does not generate listings | **Precursor exists** |
| Inventory Agent | Matching engine (`src/modules/marketplace/services/matching.service.ts`) scores interest-to-item matches — adjacent but not an "inventory" agent per se | **Precursor exists** |
| Sales Agent | — | **Not implemented** |

## Church OS

| Agent (charter) | Implementation today | Status |
|---|---|---|
| Executive Assistant | — | **Not implemented** |
| Church Administrator | — | **Not implemented** |
| Guest Follow-up | The n8n "Guest Sequence Touchpoints 2-4" workflow auto-sends/drafts follow-ups, but as scripted n8n logic, not a named reusable agent | **Precursor exists, outside this repo** |
| Care Assistant | The duplicated "crisis-screen" Claude prompt across ~5 n8n workflows (see `03-workflow-dependency-map.md`) is the closest thing — currently copy-pasted, not centralized | **Precursor exists, needs prompt-library extraction** |
| Communications Director | Split across "Substack Repurposer" and "Tertius (Publisher)" n8n workflows — boundary between this and Content Strategist (Creator OS) is unresolved | **Precursor exists, outside this repo, boundary unresolved** |
| Facilities Manager | — | **Not implemented** |
| Finance Assistant | Core's `finance.service.ts`/`/api/finance/summary` is a Core service, not Church-specific | **Not implemented as a Church agent** |

## Creator OS

| Agent (charter) | Implementation today | Status |
|---|---|---|
| Content Strategist | Overlaps with Communications Director above (Substack Repurposer/Tertius) — needs a deliberate boundary decision, not just a rename | **Precursor exists, outside this repo, boundary unresolved** |
| Writing Assistant | The "Apollos essay drafter" n8n workflow (Substack) | **Precursor exists, outside this repo** |
| Game Design Assistant | — | **Not implemented** |
| Marketing Assistant | The "Reels to YouTube" workflow's Claude captioning step is adjacent | **Precursor exists, outside this repo** |

## Shared substrate this all depends on

- `src/core/ai/client.ts` — the one Claude client wrapper; any new agent
  should be built on this, not a second client instantiation.
- `src/core/ai/tool.ts` — the `defineTool()` helper; new agents expose
  capabilities as tools surfaced via a module's `assistantTools()`
  manifest hook (`docs/decisions/0006-ai-assistant-tool-use.md`), not as
  standalone prompt scripts.
- **No AI Prompt Library shared service exists yet.** Prompts today live
  scattered: inline in `src/core/ai/*` and `src/modules/marketplace/ai/*`
  for in-repo agents, and copy-pasted across n8n workflow nodes for
  Church/Creator agents (the crisis-screen duplication is the clearest
  symptom). Building the Prompt Library shared service and migrating
  both sides onto it is the single highest-leverage Shared Services gap
  — it directly fixes the n8n duplication flagged in
  `03-workflow-dependency-map.md` and gives future Church/Creator OS
  agents in this repo something to share with n8n rather than
  duplicating prompts a third time.
