# 0015 — Taylor OS rebrand and Helm naming

## Context

0013 renamed the project from "Marketplace CRM" to "Founder OS" when it
grew a shared Core and its first additional (stub) modules. Since then,
the owner's standing product charter has named the overall platform
**"Taylor OS"** — a personal operating system spanning four domains
(an executive dashboard, Marketplace, Church, and Creator), on top of
shared services, consumed by named AI agents. That charter also uses
"Taylor OS" for one specific piece: the executive-dashboard sub-system
that aggregates the other three and adds no business logic of its own.
Using the same name for both the umbrella platform and one of its four
sub-systems is ambiguous in code, docs, and conversation, and has to be
resolved before the architecture documentation suite (`docs/architecture/`)
can reference either name consistently.

Separately, a broader audit (see `docs/architecture/03-workflow-dependency-map.md`)
found that a live, out-of-repo n8n instance already runs real Church and
Creator automations that have no equivalent in this app yet — "Founder
OS" as a name undersold how much of the target shape (four domains,
AI agents, shared services) was already implied by that existing
automation fleet, not just this repository.

## Decision

- The umbrella platform is renamed **Founder OS → Taylor OS**, matching
  the owner's charter. This supersedes 0013's "Founder OS" framing as
  the platform's identity going forward; 0013 is left unmodified as a
  historical record of the Marketplace-CRM → Founder-OS rename, exactly
  as 0013 itself did not delete the pre-rebrand history it replaced.
- The executive-dashboard sub-system — the one that aggregates the other
  three OSes and owns no business logic of its own — is named **Helm**,
  not "Taylor OS." Helm was chosen over generic alternatives ("Command
  Center," "Bridge") because it reads as a single point of control an
  owner steers everything from, is one syllable, and does not collide
  with any name already in informal use in the existing n8n fleet (the
  Church ops team's own dashboard-reader workflows are informally called
  "FleetDeck/Steeple" — see 03-workflow-dependency-map.md) or with the
  other three sub-system names (Marketplace OS, Church OS, Creator OS).
- **No files, folders, routes, or the `package.json` `name` field are
  renamed in this pass.** This ADR records the naming decision only; the
  architecture documentation suite (`docs/architecture/`) is written
  against these new names, but the codebase itself still says
  "Founder OS" / `founder-os` until a dedicated rename pass — mirroring
  how 0013 was itself a deliberate, scoped route-map exercise rather than
  a silent mechanical find-and-replace. That follow-up rename pass should
  produce its own ADR and route map, the same way 0013 did for the prior
  rebrand.

## Consequences

- Going forward, "Taylor OS" in any new doc, commit message, or
  conversation refers to the umbrella platform; "Helm" refers
  specifically to the executive-dashboard sub-system. "Founder OS" now
  means "the codebase as it stood before this rename decision" — a
  historical/legacy term, not the current product name.
- Until the follow-up rename pass lands, there is a deliberate,
  documented mismatch between the product name (Taylor OS) and what the
  repository, `package.json`, README, and route paths still say
  (Founder OS). This is acceptable short-term because nothing external
  depends on the string "Founder OS" the way `POST /api/webhooks/n8n`'s
  path and field names are a real external contract (see 0008, 0013) —
  there is no equivalent hard dependency on the platform's display name.
- `docs/architecture/09-naming-conventions.md` is the canonical reference
  for the four OS names (Helm, Marketplace OS, Church OS, Creator OS) and
  should be updated first if any of them changes again.
