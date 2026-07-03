import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma 7 requires an explicit driver adapter instead of a bundled query
 * engine binary. This was originally `@prisma/adapter-better-sqlite3`; the
 * cutover to Postgres (Neon) swapped in this one adapter plus the
 * `provider` in schema.prisma — everything else (repositories, services,
 * routes) was unaffected, exactly as anticipated in
 * docs/decisions/0007-postgres-migration-path.md.
 *
 * `pg` (a plain TCP client) rather than `@prisma/adapter-neon`'s
 * WebSocket-based driver: it needs no Node-runtime WebSocket polyfill, and
 * Neon's own "pooled connection" connection string (labeled as such in the
 * Neon/Vercel dashboard) already solves the "too many serverless-function
 * connections" problem `adapter-neon` exists for. Use that pooled string as
 * DATABASE_URL in any serverless deployment.
 */
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
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
