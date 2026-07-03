# 0006 — AI assistant: tool use over repositories, never generated SQL

> **Update (Founder OS refactor):** the assistant loop now lives at
> `src/core/ai/assistant.ts` and composes `coreTools` (search_contacts,
> get_contact_profile, get_contact_finance_summary, get_tasks_due) with
> `MODULES.flatMap(m => m.assistantTools?.() ?? [])` — every registered
> module contributes its own tools via its manifest rather than the
> assistant hardcoding one fixed list. Marketplace's original seven tools
> moved unchanged (aside from `customerId` → `contactId` renames) into
> `src/modules/marketplace/manifest.ts`'s `assistantTools()`. `defineTool`
> itself moved to `src/core/ai/tool.ts` so module manifests can import it
> without an import cycle through the assistant. See 0010.

## Context

The spec wants natural-language Q&A: "Who wanted a KitchenAid mixer?",
"What items sell fastest?", "Which buyers respond the quickest?". The
tempting shortcut is to have Claude write a SQL/Prisma query directly
against the schema.

## Decision

`src/lib/ai/assistant.ts` gives Claude a fixed set of typed tools backed by
`src/lib/services/analytics.service.ts` (`search_customers_by_interest`,
`get_top_buyers_by_category`, `get_fastest_selling_categories`,
`get_fastest_responders`, `search_inventory`, `get_customer_profile`,
`get_match_suggestions_for_item`). Claude can only call these — it cannot
generate arbitrary queries. This rules out SQL injection and query
hallucination by construction, not by prompting.

Each tool is defined once with `defineTool({ schema, run })`: `schema` is a
Zod schema shared between the tool's `input_schema` (via
`z.toJSONSchema`) and runtime validation of whatever Claude actually sends
back before `run` is invoked — a mismatched or malformed tool call fails
loudly instead of reaching the database with unchecked input.

The assistant loop (`answerAssistantQuestion`) sends the question, executes
whatever tools Claude requests, feeds results back as `tool_result` blocks,
and repeats (capped at `MAX_TOOL_ROUNDS`) until Claude responds with plain
text. The response includes which tools were called, surfaced in the UI as
a transparency detail.

## Consequences

- Adding a new question the assistant should answer means adding one
  function to `analytics.service.ts` and one `defineTool(...)` entry — not
  expanding what Claude is allowed to touch in the database.
- The assistant is bounded by the tools that exist today; it can't answer
  something genuinely novel outside their scope. Given the alternative is
  free-form query generation against a live production database, this is
  the right trade for an MVP.
- `analytics.service.ts` intentionally duplicates a little logic that
  overlaps with `dashboard.service.ts` (e.g. both read sold inventory) —
  they're shaped differently (fixed widgets vs. ad hoc parameterized
  lookups) and forcing one shared abstraction now would be premature.
