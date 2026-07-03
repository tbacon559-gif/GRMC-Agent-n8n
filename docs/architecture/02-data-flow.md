# Data Flow

Two real data flows exist today. They do not talk to each other, which is
the central finding of this document.

## Flow A — Marketplace (in-repo, working end to end)

```
Facebook Messenger conversation
        │
        ▼
n8n: messenger-conversation-ingest.json
  (webhook trigger → Set node → HTTP POST)
        │
        ▼
POST /api/webhooks/n8n
  body: { messengerThreadId, customerName, facebookProfileUrl, rawText, occurredAt }
  (frozen contract — docs/decisions/0008, 0013)
        │
        ▼
Core: find-or-create Contact (src/core/repositories/contact.repository.ts)
        │
        ▼
Marketplace: create MarketplaceConversation, raw text retained for audit
        │
        ▼
Claude structured extraction (src/modules/marketplace/ai/extraction.ts)
  → interestedItem, requestedItems, budgetCents, urgency, buyingIntent,
    sentiment, summary  (docs/decisions/0005-ai-extraction-structured-storage.md)
        │
        ▼
MarketplaceInterest row created
        │
        ▼
Matching engine (src/modules/marketplace/services/matching.service.ts)
  runs automatically on POST /api/marketplace/items
  → scores open interests against the new item → MarketplaceMatch rows
        │
        ▼
Surfaced via /marketplace UI, dashboard widget, and the AI assistant's
Marketplace tools (src/core/ai/assistant.ts + module assistantTools())
```

This is the one flow that is fully wired: external trigger → webhook →
Core → module AI → module business logic → UI/assistant.

## Flow B — Church (live, but entirely disconnected from this app)

```
Guest walks in / fills out a form
        │
        ▼
n8n: Guest Reconciliation (daily, schedule-triggered)
  reads/writes Google Sheets + Breeze API + Gmail, runs a Claude
  "crisis-screen" prompt
        │
        ▼
Guest_Pipeline / Formation_Tracker / Touchpoints_Due (n8n data tables)
        │
        ▼
n8n: Guest Sequence Touchpoints 2-4 (daily; auto-sends T2/T3, drafts T4)
        │
        ▼
n8n: Formation Pipeline → Membership Handoff → Groups/Bands →
     New-Member Landing Check
        │
        ▼
(dead end — no webhook, no API call, no write of any kind into this
 repo's Postgres database or Contact/Task/FinanceTransaction tables)
```

**This is the top data-flow gap this audit found.** The richest, most
mature automation in the entire fleet — a multi-stage guest-to-member
pipeline already running daily against real data — produces no record
Taylor OS's Core (Contacts, Tasks, AI Memory) or Helm's future dashboard
could ever see, because nothing in this chain calls
`POST /api/webhooks/n8n` or any other endpoint into this app. A guest who
is mid-formation in the n8n pipeline does not exist as a `Contact` here.

The Church social-publishing sub-flow (Apollos essay drafter → Substack
Repurposer → Tertius Publisher via Postiz → Post Verification) and the
Creator "Neon Hours" YouTube pipeline (Auto-Queue → Long-form Build via
an external Fly.io render worker → Reels to YouTube) are structured the
same way: fully live, fully disconnected from this repo.

## Implication for Church OS and Creator OS

Building Church OS / Creator OS "to full depth" per the product charter
means, concretely: give these n8n chains the same closing step Flow A
already has — a webhook call into a new `/api/webhooks/church` or
`/api/church/*` / `/api/creator/*` endpoint that writes into new Core-
and module-scoped tables (see `06-database-schema.md`), so that a guest,
a formation stage, a piece of published content, or a video-build event
becomes a real row Helm can aggregate and the AI assistant can reason
about — not a new rebuild of what n8n already does well. See
`10-implementation-phases.md` Phase 2.
