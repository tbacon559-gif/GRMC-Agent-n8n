import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma 7 requires an explicit driver adapter instead of a bundled query
 * engine binary. Swapping SQLite for Postgres in production means swapping
 * this one adapter (e.g. `@prisma/adapter-pg`) plus the `provider` in
 * schema.prisma — everything else (repositories, services, routes) is
 * unaffected. See docs/decisions/0007-postgres-migration-path.md.
 */
function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton across Next.js dev-server hot reloads. Without this, every
 * module reload would open a fresh SQLite connection and eventually exhaust
 * file handles.
 */
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
