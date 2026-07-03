# 0008 — n8n integration: webhook contract, not a provisioned workflow

> **Update (Founder OS refactor):** the route path (`POST
> /api/webhooks/n8n`) and its request body field names (including
> `customerName`) are kept exactly as they were — this is an external
> contract the n8n workflow JSON hardcodes, so it is deliberately *not*
> renamed even though the customer it identifies/creates is now a Core
> `Contact` and the conversation pipeline lives at
> `src/modules/marketplace/services/marketplace-conversation.service.ts`.
> See 0013 for the full old→new route map and what was intentionally left
> unchanged.

## Context

The spec lists n8n as part of the stack for integration — in practice, the
piece n8n is best suited for is watching Facebook Messenger and forwarding
new messages into the CRM, since Marketplace has no public API for this.

## Decision

The CRM exposes one endpoint for this: `POST /api/webhooks/n8n`
(`src/app/api/webhooks/n8n/route.ts`). It:

1. Requires a shared secret in the `x-n8n-webhook-secret` header, checked
   against `N8N_WEBHOOK_SECRET` — this endpoint has no other auth, since
   it's meant to be called machine-to-machine from an n8n workflow.
2. Identifies the customer by `messengerThreadId`, creating a new
   `Customer` (status `prospect`) if the thread hasn't been seen before —
   unlike `POST /api/conversations`, which requires an existing
   `customerId`, because n8n is often the first time the CRM learns about
   a contact at all.
3. Runs the same `ingestConversation` pipeline as the manual "log a
   conversation" UI form — the extraction, matching-relevant side effects,
   and AI summary update are identical regardless of how the raw text
   arrived.

`n8n/workflows/messenger-conversation-ingest.json` is an example workflow
(Messenger trigger → HTTP Request node → this webhook) for a seller to
import into their own n8n instance and point at their Page.

This repo does not provision or manage a live n8n workflow. Building the
receiving contract and documenting it is the CRM's job; wiring up a
specific seller's Facebook Page, credentials, and n8n instance is a
deployment-time concern for whoever runs it.

## Consequences

- The CRM has zero runtime dependency on n8n being present — every feature
  is reachable through the regular UI/API without it. n8n is purely an
  optional automation layer on top.
- If a seller doesn't use n8n at all, `LogConversationForm` on the customer
  page does the same job by hand (paste in a conversation excerpt).
