# Workflow Dependency Map

## Audit caveat

`search_workflows`, `list_tags`, and `search_projects` (n8n MCP tools)
were blocked/non-authorized during this audit and never returned. This
map was reconstructed from `search_executions` (282 recent executions,
~7/1–7/3) plus `get_workflow_details` on each of the 32 distinct
workflow IDs found that way, cross-referenced against `list_credentials`
and the 13 configured n8n data tables. **This is an execution-based
sample, not a guaranteed-complete inventory** — any workflow with no
recent execution (inactive, rarely-triggered, or manual-only) would not
appear here. One workflow (`FPXulWJMKKSwYwgt`, runs daily ~10am) exceeded
tool output size and could not be inspected this pass.

**Recommendation:** get MCP list/search access working before treating
this map as exhaustive, and re-run the audit — do not use this document
alone to justify deleting a workflow that simply didn't execute in the
sampled window.

## Church / GRMC — Guest & Formation pipeline

| Workflow | Trigger | Recommendation | Why |
|---|---|---|---|
| Guest Reconciliation | Daily | **Improve** | Live, works, but seeds the crisis-screen prompt duplication below |
| Guest Sequence Touchpoints 2-4 | Daily | **Improve** | Same crisis-screen duplication |
| Phoebe / Formation Pipeline | Daily | **Improve** | Same |
| Ruth / Membership | Daily | **Improve** | Same |
| Membership Handoff (Ruth→Aquila) | Daily | Keep | Simple handoff, no duplication found |
| Aquila / Groups & Bands | Daily | Keep | — |
| New-Member Landing Check | Daily | Keep | — |

**Cross-cutting issue:** the same "crisis-screen" Claude prompt/code
block is copy-pasted across ≥5 of the above workflows, and the copies
have already started to drift from each other. **Improve** = extract into
one shared n8n sub-workflow (or, longer-term, one entry in the AI Prompt
Library shared service — see `05-ai-agent-inventory.md`) called by
reference from all five, so a prompt fix lands once instead of five
times.

## Church / Ops & Pastoral

| Workflow | Trigger | Recommendation | Why |
|---|---|---|---|
| Morning Briefing | Tue/Thu | Keep | Working, no issues found |
| Pastoral visit logging | Confirm-first | Keep | — |
| Pastoral visit booking | Confirm-first | Keep | — |
| Order of Worship builder | Thu | Keep | Claude-filled, working |
| **Kids Korner Thursday Confirm** | Weekly | **Fixed 2026-07-03** | Was named `"...TEMP AUTO-SEND thru 6/27"` and still actively auto-sending past its expiry as of 7/2. Reverted to draft-only (all three Gmail actions now create drafts, not sends) and renamed to `"GRMC Kids Korner — Thursday Confirm (Draft-Only)"`, matching the identical fix already applied to Order of Worship on 7/2. |
| Save Kids Ministry Schedule | Webhook | Keep | — |
| Breeze Directory Cache | Webhook | Keep, and **connect** | Should become the seed for Church OS's Breeze sync (see `02-data-flow.md`) |
| Breeze People Search | Webhook | Keep, and **connect** | Same |
| Notion Tasks→Sheet sync | — | **Replace long-term** | Once Church OS has its own Task rows in Core (`Task.module = "church"`), this cross-tool sync becomes redundant |
| Projects Update Status | Webhook | **Merge into Church OS** | Once church-projects grows real depth |
| Dashboard readers ×3 (Projects/Pastoral/Guest) | Inactive, manual | **Retire, replace with Helm** | These are exactly the "FleetDeck/Steeple" exec-dashboard concept the product charter asks for — Helm supersedes them rather than needing its own new design |
| Fleet Health Error Alert | Error-trigger hub | **Keep** | Wired as `errorWorkflow` on nearly every other GRMC workflow — a good centralized pattern worth keeping and extending to Marketplace OS/Creator OS workflows as they're built |

## Church / Social publishing pipeline

| Workflow | Trigger | Recommendation | Why |
|---|---|---|---|
| Apollos essay drafter (Substack) | Wed 9pm | **Merged 2026-07-03** | Two versions were active and racing: `"GRMC Social — Apollos (ESSAY DRAFTER)"` had Notion research enrichment but sent live email; `"GRMC Apollos Essay Drafter"` had daughter/Tiffany consent guardrails and correct draft-only behavior but no research step. Merged the guardrails and draft-only fix into the research-enriched workflow, deactivated the other. |
| Substack Repurposer | On new essay | Keep | Approval-gated, working |
| Tertius (Publisher via Postiz) | On approval | Keep | — |
| Post Verification | Thu | Keep | — |

## Creator / "Neon Hours" (YouTube)

| Workflow | Trigger | Recommendation | Why |
|---|---|---|---|
| Auto-Queue Long-form | 30min poll | **Keep short-term, flag for Creator OS migration** | Works today; Creator OS should eventually own the queue table (`Neon Schedule`/`Neon Assets` n8n data tables → Creator OS `ContentCalendar`, see `06-database-schema.md`) |
| Long-form YouTube Build | Manual + daily | Keep short-term | Calls an external Fly.io render worker — out of scope to replace |
| Reels to YouTube | Daily | Keep short-term | Claude captions + approval-gated IG/FB posting |

## Duplicate/racing workflows (fixed 2026-07-03)

1. **`"GRMC - Inbox Auto-Archive"`** (`3dhjecfpJIKspHn5`) and
   **`"GRMC Inbox Auto-Archive"`** (`lNvS6XUWJ7d0Z6bS`) — were both
   active, both firing daily 6am Sun–Thu, with different (not identical)
   Gmail exclusion logic: one protected important-flagged mail, the
   other protected `@graceresurrection.org` senders. **Fixed:** merged
   both exclusions into `3dhjecfpJIKspHn5`'s query
   (`-is:starred -is:important older_than:2d -from:graceresurrection.org`)
   and deactivated `lNvS6XUWJ7d0Z6bS`.
2. **`"GRMC Social — Apollos (ESSAY DRAFTER)"`** (`aaKMqRx8JHOFpoXe`) and
   **`"GRMC Apollos Essay Drafter"`** (`YqShTfy1qVySyktC`) — see above.
   **Fixed:** guardrails and draft-only behavior merged into
   `aaKMqRx8JHOFpoXe`, `YqShTfy1qVySyktC` deactivated.

## Coverage gaps — credentials/tables with no matching workflow found

- `TR Flips Ledger`, `TR Flips Subscribers` (a reselling side-business) —
  **Replace**: this is architecturally a second Marketplace-OS tenant;
  once Marketplace OS is generalized beyond Facebook Marketplace, TR
  Flips should migrate onto it rather than staying a separate,
  undocumented n8n-adjacent system.
- `Coach Botabban Seen Bluesky/Tweets Posts` (a social bot) — **Investigate**:
  no owning OS identified yet; likely Creator OS, needs a follow-up
  conversation with the owner before a recommendation can be made.
- `Household Notes` — **Investigate**: likely Helm/personal-KPI adjacent,
  needs clarification of what currently writes to it.

## Immediate action items

1. ~~Fix or deactivate the Kids Korner "TEMP" auto-send.~~ **Done 2026-07-03.**
2. ~~Deactivate one workflow in each of the two duplicate/racing pairs.~~ **Done 2026-07-03** (Inbox Auto-Archive: merged + deactivated; Apollos: merged + deactivated).
3. Restore `search_workflows`/tag/project MCP access before relying on
   any future n8n audit as complete — still outstanding; these three
   fixes were applied via direct workflow-ID lookups, not a full-fleet
   sweep.
