import { execSync } from "node:child_process";
import { Client } from "pg";

/**
 * Runs once before the whole test suite: fully resets a dedicated test
 * Postgres database and pushes the schema fresh, so repository/service
 * tests exercise a real database instead of mocks. `TEST_DATABASE_URL` must
 * be a database distinct from your dev `DATABASE_URL` — the schema reset
 * below (`DROP SCHEMA public CASCADE`) would otherwise destroy real dev
 * data. Vitest doesn't load `.env` by default, so `vitest.config.ts`
 * imports `dotenv/config` before this runs.
 */
export default async function setup() {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it at a dedicated test Postgres database " +
        "(never your dev database — this setup drops and recreates its schema on every run). See .env.example.",
    );
  }

  const client = new Client({ connectionString: testDatabaseUrl });
  await client.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS "public" CASCADE; CREATE SCHEMA "public";');
  } finally {
    await client.end();
  }

  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "inherit",
  });
}
