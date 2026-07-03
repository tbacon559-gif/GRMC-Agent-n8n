# 0009 — AI memory: append-only log, never overwrite history

## Context

The Founder OS vision is explicit: "AI Memory... never overwrite history.
Instead build an evolving memory." Before this refactor, `Customer.aiSummary`
was a single column overwritten every time a new conversation was ingested
(see 0005) — correct enough for "what does this person want right now," but
structurally incapable of ever answering "what have I learned about this
person over time."

## Decision

`ContactMemoryEntry` (`prisma/schema.prisma`) is a new, append-only table:
`contactId`, `module` (nullable — null means a universal fact about the
person, not tied to any one business), `kind` (`fact` | `preference` |
`summary`), `content`, and optional `sourceType`/`sourceId` pointing back at
whatever produced the entry. `src/core/repositories/memory.repository.ts`
exposes exactly two operations: `create` and `listByContact`. There is no
`update` and no `delete` — a correction is recorded as a new entry, not a
mutation of an old one. `memory.repository.test.ts` asserts this directly:
two `create` calls for the same contact produce two rows, not one.

`Contact.aiSummaryCache` (renamed from `aiSummary`) still exists and is still
overwritten on every conversation — but it is now explicitly documented as a
disposable read-optimization cache, not the source of truth. Every call to
`ingestConversation` (`src/modules/marketplace/services/marketplace-conversation.service.ts`)
does both: refresh the cache *and* append a `ContactMemoryEntry`. Nothing a
module ever recorded about a contact is lost, even though the cache still
only reflects the latest turn.

## Consequences

- True rolling synthesis across the full memory log (e.g. an AI call that
  reads every `ContactMemoryEntry` for a contact and produces one coherent
  narrative) is a real, valuable upgrade this doesn't build yet — it's a
  natural next step once there's enough history per contact to make it
  worthwhile, not required for the append-only guarantee itself.
- Every module gets this for free by writing to `memoryRepository.create()`
  — a stub module recording "client mentioned they're allergic to a specific
  fertilizer" gets the same never-overwritten guarantee as Marketplace's
  conversation summaries, with zero extra schema or repository work.
