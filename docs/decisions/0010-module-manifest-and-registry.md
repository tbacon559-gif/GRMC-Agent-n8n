# 0010 — Module manifest + registry: the plugin pattern, and its honest limits

## Context

The Founder OS vision asks for pluggable business modules — "a new module
should be creatable without modifying the rest of the application" — sitting
on a shared Core (Contacts, Tasks, Calendar, Finance, AI Memory,
Notifications, Documents). Marketplace becomes the first of several; five
more (Lawn Care, Publishing, Video Game Studio, AI Products, Church Projects)
are scaffolded as thin stubs this pass.

## Decision

Every module exports one `ModuleManifest` object (`src/core/modules/types.ts`):

```ts
interface ModuleManifest {
  id: ModuleId;
  name: string;
  nav: { href: string; label: string; icon: LucideIcon };
  dashboardWidget?: () => Promise<ModuleWidgetData>;
  assistantTools?: () => ToolDef[];
  briefingContributor?: (ctx: { now: Date }) => Promise<string[]>;
  getContactSummary?: (contactId: string) => Promise<ContactModuleSummary | null>;
}
```

`src/core/modules/registry.ts` is the one central registration point:
`export const MODULES: ModuleManifest[] = [marketplaceModule, lawnCareModule, ...]`.
Every Core consumer — `Sidebar.tsx`'s nav, `dashboard.service.ts`'s
`Promise.all(MODULES.map(m => m.dashboardWidget?.()))`,
`briefing.service.ts`'s `MODULES.map(m => m.briefingContributor?.())`,
`core/ai/assistant.ts`'s `MODULES.flatMap(m => m.assistantTools?.() ?? [])`,
and the contact page's `MODULES.map(m => m.getContactSummary(id))` — iterates
this array and never branches on a module's identity by name. Registering
module #7 means: create `src/modules/<name>/manifest.ts`, import it in
`registry.ts`, add one array entry. `registry.test.ts` asserts every module
has a unique id and a valid nav entry, so a copy-paste mistake in a new
manifest fails a test immediately rather than silently breaking nav.

## Honesty on "pluggable"

This is **static-import composition verified at build time**, not runtime
plugin loading. Next.js requires every route to exist under `src/app/**` at
build time, so a new module still needs its own thin page/route file — you
cannot drop a module folder into a running instance without a rebuild. A
true no-rebuild plugin system (dynamic `import()`, a custom server,
hot-reloadable route registration) would be materially heavier engineering
than "calm, minimal" calls for, and isn't what was asked for this pass. What
this pattern actually buys: adding a module never requires *editing*
existing Core or other-module files — only *adding* a new manifest, a
registry line, and (for a real, non-stub module) its own repositories,
services, and pages.

## Consequences

- Core has zero compile-time or runtime dependency on any specific module's
  internals — it only depends on the `ModuleManifest` shape.
- A stub module (one repository, one manifest, one page) proves the full
  contract end-to-end without speculative CRUD, matching the "thin stubs"
  scope decision for this pass.
- Full-depth modules (like Marketplace) can still expose richer,
  module-specific pages/APIs beyond what the manifest contract requires —
  the manifest is the minimum contract for Core integration, not a ceiling.
