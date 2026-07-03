# Changelog

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
