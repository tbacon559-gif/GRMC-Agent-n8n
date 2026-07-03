# Implementation Phases

Synthesizes `01`–`06`. Each phase ends with a stop for approval before
the next begins, per the product charter's process and this session's
own approved plan.

## Phase 0 — This milestone (done)

Architecture documentation suite (`docs/architecture/*`,
`docs/decisions/0015`). No code, schema, or n8n changes.

## Phase 1 — Fix live n8n bugs (outside this repo, done 2026-07-03)

Independent of the Taylor OS redesign — these were operational bugs found
during the audit, fixed directly in the live n8n instance (not this
repo):
1. **Kids Korner "TEMP AUTO-SEND thru 6/27"** (`fuzw9D2T6tfSsTuy`) —
   confirmed it was still live and auto-sending as of 7/2, past its
   stated window. Reverted all three Gmail actions to draft-only,
   matching the identical fix already applied to the sibling Order of
   Worship workflow on 7/2. Renamed to drop the stale "TEMP" label.
2. **Inbox Auto-Archive duplicates** — the two workflows had genuinely
   different protections (one excluded starred/important mail, the
   other excluded church-domain mail), not identical logic. Merged both
   exclusions into the original workflow (`3dhjecfpJIKspHn5`) and
   deactivated the redundant copy (`lNvS6XUWJ7d0Z6bS`).
3. **Apollos Essay Drafter duplicates** — also not identical: one had
   richer Notion research enrichment, the other had consent guardrails
   for content involving Taylor's daughter and Tiffany plus correct
   draft-only behavior. Per Taylor's direction, merged the guardrails
   and draft-only behavior into the research-enriched workflow
   (`aaKMqRx8JHOFpoXe`) and deactivated the simpler duplicate
   (`YqShTfy1qVySyktC`).

All three fixes were published (not left as unpublished drafts) and
verified live via direct workflow lookups. `search_workflows`/tag/
project MCP tools remained blocked this session, so a full-fleet
confirming sweep beyond these specific workflows was not possible —
restoring that access is still recommended before treating the fleet as
fully audited.
3. Restore `search_workflows`/tag/project MCP access so future audits
   are complete, not execution-history reconstructions.

## Phase 2 — Church OS code depth + Breeze connection

Highest-value gap found: Church has the richest live automation of any
domain, and none of it is visible to this app. Concretely:
- Add Church OS tables per `06-database-schema.md` (`Guest`,
  `FormationStage`, `MembershipCohort`, `VolunteerAssignment`,
  `PastoralVisit`, `PrayerRequest`, etc.), following the same
  repository/service/manifest pattern Marketplace demonstrates.
- Add a webhook endpoint (`POST /api/webhooks/church` or `/api/church/*`)
  so the existing n8n Guest→Formation→Membership chain gains a closing
  step into this database, closing the Flow B gap in `02-data-flow.md`.
- Extract the duplicated "crisis-screen" prompt into a shared prompt
  (n8n sub-workflow now; AI Prompt Library service once it exists) —
  first concrete step toward the Care Assistant agent.
- Rename `church-projects` module to `church` as part of this phase
  (folder, manifest `id`, routes) — this is the natural point to also
  execute the Founder-OS → Taylor-OS file/route rename from
  `docs/decisions/0015`, rather than doing a separate pass later.

## Phase 3 — Helm (executive dashboard)

Once at least two OSes (Marketplace, Church) have real
`dashboardWidget()`/`briefingContributor()` data worth aggregating:
- Build Helm as a composition layer, no new business-logic tables beyond
  small presentation state (priorities, weekly-review notes).
- Retire the three inactive n8n "FleetDeck/Steeple" dashboard-reader
  workflows in favor of Helm.
- First agent: Chief of Staff, upgrading the existing
  `assistant.ts`/`briefing.service.ts` rather than building new.

## Phase 4 — Creator OS depth

- Consolidate `publishing`/`game-studio`/`ai-products` stubs into one
  `creator` module (or keep separate if they prove genuinely
  independent enough — decide during this phase, not before).
  Add `ContentCalendar` informed by n8n's `Neon Schedule`/`Neon Assets`.
- Resolve the Content Strategist / Communications Director boundary
  flagged in `05-ai-agent-inventory.md` before building either agent.
- Migrate the Neon Hours YouTube pipeline's queue ownership from n8n
  data tables to this repo's `ContentCalendar`, keeping n8n for the
  actual render/publish steps (no reason to rebuild the Fly.io render
  worker integration).

## Phase 5 — Marketplace OS completion

- Add eBay, shipping, and pickup-scheduling per the charter's feature
  list (`06-database-schema.md`).
- Migrate `TR Flips Ledger`/`TR Flips Subscribers` onto Marketplace OS
  once it's generalized beyond Facebook-Marketplace-specific fields.
- Build out the Pricing, Listing, Inventory, and Sales agents from their
  current precursors (`05-ai-agent-inventory.md`).

## Phase 6 — Shared Services hardening

Only once the above phases surface concrete need (avoid building ahead
of demand, per the charter's own "will this still make sense" test):
- Authentication / User Management, if Taylor OS ever grows beyond
  single-founder use.
- AI Prompt Library as a real shared service, consuming the prompts
  centralized in Phase 2.
- Files/Search/Reporting/Email/SMS/Templates/Analytics/Audit
  Logs/Settings, each only when a specific OS actually needs it rather
  than pre-built speculatively.

## Explicit non-sequencing note

These phases are not strictly serial — Phase 1 (n8n bug fixes) can run
in parallel with any other phase since it's a different system
entirely. Phases 2–5 should each get their own planning-milestone
documentation update (this suite is a living reference, not a one-time
artifact) and their own approval checkpoint before implementation
begins, per the charter's process.
