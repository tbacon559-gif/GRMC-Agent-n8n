# 0012 — Core/module schema boundary: no typed FK from Core into a module

## Context

"People exist once, businesses are attached to people" needs a concrete
schema rule, or every new module risks becoming a special case Core has to
know about.

## Decision

`Contact` is the one universal person record, owned entirely by Core. Every
module that has a real business relationship to a person adds its own
extension table with a foreign key **back to** `Contact` —
`MarketplaceProfile.contactId`, `LawnCareClient.contactId`,
`PublishingProject.contactId?`, etc. — never the other way around. Core
never holds a typed relation *into* a module's business logic: `Task`'s
`module`/`sourceType`/`sourceId` are plain untyped strings, not a Prisma
relation to `MarketplaceItem` or any other module table; `FinanceTransaction`
and `ContactMemoryEntry` follow the same pattern.

`Contact` does declare one optional back-relation field per module
(`marketplaceProfile`, `lawnCareClient`, `publishingProjects`, ...) — this is
required by Prisma's single-schema-file rule that a relation must be
declared on both models it connects, **not** a real code-level dependency.
No Core repository or service (`src/core/repositories/contact.repository.ts`,
`src/core/services/*`) ever reads these fields; only the owning module's own
repository does (e.g. `marketplaceProfileRepository.findByContactId`). A
contact detail page composes module-specific detail either through the
generic `ModuleManifest.getContactSummary(contactId)` hook (used by every
stub module) or, for a full-depth module like Marketplace, by directly
querying that module's own repository from the page — both patterns keep
Core itself branch-free on module identity.

This is also why a fresh schema (no migration script) was the right call for
this refactor rather than trying to preserve `Customer` as a shared base
table: `Customer.status` (prospect/buyer/seller) was Marketplace vocabulary
masquerading as a universal field. Collapsing it into `MarketplaceProfile.status`
and generalizing `FollowUpReminder` into the universal `Task` are the same
fix — vocabulary that only makes sense for one business moved into that
business's own table.

## Consequences

- Deleting a module's tables (dropping a business you no longer run) never
  requires a Core migration — Core doesn't know those tables exist beyond
  the required back-relation field.
- A module can be developed and tested in near-isolation against Core's
  public repository/service surface, without needing to understand any
  other module's schema.
- The cost is one boilerplate back-relation field per module on `Contact` —
  a fixed, small, one-time cost per module, not a growing one.
