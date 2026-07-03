# Changelog

## 2026-07-03 — Fixed three live n8n bugs (Phase 1)

- **Kids Korner "TEMP AUTO-SEND thru 6/27"** (`fuzw9D2T6tfSsTuy`): still
  live and auto-sending past its expiry. Reverted all three Gmail
  actions to draft-only and renamed to drop the stale label, matching
  the identical fix already applied to Order of Worship on 7/2.
- **Inbox Auto-Archive duplicates**: two active workflows firing at the
  same time with different (not identical) protections. Merged both
  exclusion rules into one workflow, deactivated the other.
- **Apollos Essay Drafter duplicates**: one had Notion research
  enrichment, the other had consent guardrails for content involving
  Taylor's daughter and Tiffany plus correct draft-only behavior.
  Merged guardrails + draft-only into the research-enriched workflow
  (Taylor's direction), deactivated the other.
- All three fixes published and verified live. `search_workflows`/tag/
  project MCP tools remained blocked — these were targeted fixes via
  direct workflow-ID lookups, not a full-fleet confirming sweep.

## 2026-07-03 — Taylor OS architecture documentation suite (Planning Milestone 1)

- Added `docs/decisions/0015-taylor-os-rebrand-and-helm-naming.md`:
  renamed the umbrella platform Founder OS → Taylor OS; named the
  executive-dashboard sub-system "Helm." No files/routes/schema renamed
  yet — naming decision only.
- Added the full `docs/architecture/` suite (system architecture,
  data flow, workflow dependency map, API inventory, AI agent inventory,
  database schema, folder structure, coding standards, naming
  conventions, implementation phases), grounded in an audit of the real
  in-repo codebase (then "Founder OS") and the live, separate n8n
  automation fleet (~32 workflows).
- Audit found two live n8n bugs (duplicate racing workflows; a stale
  "TEMP" auto-send past its expiry) — recorded, not fixed, this pass.
- Scaffolded `docs/ops/` (prompt library, workflow catalog, AI agent
  catalog, deployment guide, ops manual, troubleshooting) as stubs
  pointing back to the architecture docs, to be populated as each OS is
  actually built.
