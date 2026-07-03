# Coding Standards

These are the standards already in force in this repo, made explicit so
Church OS, Creator OS, and Helm are built the same way Marketplace was,
not reinvented per-module. Enforcement points: `eslint.config.mjs`
(`eslint-config-next` core-web-vitals + typescript), `tsc --noEmit`
(`npm run typecheck`), and `.github/workflows/ci.yml` (typecheck, lint,
test, build on every push).

1. **Repository pattern.** Every Prisma call lives in a `*.repository.ts`
   file — services and route handlers never import `prisma` directly.
   See `docs/decisions/0001-repository-pattern.md`. A module's
   repositories are the only files in that module allowed to import
   Prisma.

2. **Money is integer cents, never a float.** Every money field is
   `xCents: Int`. Derived values (profit, totals) are computed at read
   time, never stored as a denormalized column. See
   `docs/decisions/0002-money-as-integer-cents.md` and
   `docs/decisions/0011-finance-ledger-over-counters.md` (the same
   "derive, don't store what can drift" rule applied to the Finance
   ledger).

3. **No native Prisma enums.** Every "enum-like" field is a validated
   `String`, with the allowed values living in one `enums.ts` per layer
   (`src/core/constants/enums.ts`, `src/modules/<name>/constants/enums.ts`).
   Originally forced by a SQLite constraint, kept after the Postgres
   cutover for consistency. See `docs/decisions/0003-no-native-enums-on-sqlite.md`.

4. **AI memory is append-only.** `ContactMemoryEntry` rows are never
   updated or overwritten — the repository only exposes `create` and
   `listByContact`. Any new per-OS memory/history table (Church care
   notes, Creator content history) follows the same append-only shape.
   See `docs/decisions/0009-ai-memory-append-only-log.md`.

5. **Core/module schema boundary.** Core never holds a typed relation
   *into* a module's business logic — only the reverse. See
   `docs/decisions/0012-core-module-schema-boundary.md` and
   `06-database-schema.md`.

6. **Structured AI output, not raw text, is the source of truth.**
   `MarketplaceConversation` retains raw text for audit, but every
   feature reads structured columns extracted from it, never the raw
   text directly. Any new AI-extraction pipeline (Church guest intake,
   Creator content briefs) follows this shape. See
   `docs/decisions/0005-ai-extraction-structured-storage.md`.

7. **AI assistant gets tool-use access, not free-form SQL/codegen.**
   New agents (Care Assistant, Content Strategist, etc.) are added as
   `defineTool()` entries surfaced through a module's
   `assistantTools()` manifest hook, composed by
   `src/core/ai/assistant.ts` — never a bespoke prompt-to-SQL path. See
   `docs/decisions/0006-ai-assistant-tool-use.md`.

8. **Zod validation at every boundary.** Route handlers and forms
   validate with Zod schemas in `validation/`, not ad hoc checks.

9. **Testing.** Pure logic (scoring, formatting, schema shape) gets unit
   tests; anything touching a repository/service gets a
   `*.integration.test.ts` against the real (disposable)
   `TEST_DATABASE_URL`. `fileParallelism: false` is required because
   integration tests share one database — keep new integration tests
   consistent with that constraint rather than trying to parallelize
   around it.
