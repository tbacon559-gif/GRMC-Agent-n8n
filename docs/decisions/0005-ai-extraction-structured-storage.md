# 0005 — Conversation extraction: structured storage, AI output is not the source of truth

## Context

The spec: given conversation text, extract interested item, requested
items, budget, urgency, city, buying intent, follow-up reminders,
sentiment, and a summary — and "save structured data instead of raw AI
output."

## Decision

`src/lib/validation/extraction.ts` defines `conversationExtractionSchema`
(Zod) as the single contract for what Claude must return.
`src/lib/ai/extraction.ts` calls `client.messages.parse()` with
`output_config.format: zodOutputFormat(conversationExtractionSchema)` —
Claude's structured-output mode, not manual JSON-parsing of free text — so
the response is either a schema-valid object or the call fails loudly.

Every field on `Conversation` that the rest of the app reads
(`interestedItem`, `requestedItems`, `budgetCents`, `urgency`, `city`,
`buyingIntent`, `sentiment`, `summary`) is one of these validated columns.
`extractionRaw` (the full API response) and `extractionModel` are also
kept, but only for debugging/prompt-tuning audits — no feature reads them.
This means a future prompt change or model swap can't silently change
apps' behavior in subtle ways: the shape of what the app consumes is fixed
by the schema, independent of prompt wording.

`src/lib/services/conversation.service.ts#ingestConversation` fans the
extraction out into real rows: a `CustomerInterest` (fuel for the matching
engine), `FollowUpReminder`s (converted from the AI's relative `dueInDays`
into an actual `dueAt` timestamp), and an update to `Customer.lastContactAt`
and `Customer.aiSummary`.

## Simplification: aiSummary is "most recent," not synthesized

`Customer.aiSummary` is currently overwritten with the latest
conversation's summary rather than synthesized across the customer's full
history. This is a deliberate MVP simplification — correct enough for a
"what does this person want right now" glance, cheap (no extra AI call),
and simple to reason about. A natural upgrade path is to have
`ingestConversation` pass the previous summary plus the new conversation to
Claude and ask for a merged summary, once that nuance is worth the extra
API call.

## Consequences

- The AI service is optional at the infrastructure level: without
  `ANTHROPIC_API_KEY`, extraction throws a typed `AIServiceUnavailableError`
  and the route returns 503 — customers, inventory, matching, and the
  dashboard all keep working.
- Conversations can still be entered without AI involvement at all (the
  seed script does this) by writing the structured columns directly,
  since they're just plain columns, not something only the AI pipeline
  can populate.
