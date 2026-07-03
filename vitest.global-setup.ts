import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

const TEST_DB_PATH = path.resolve(__dirname, "prisma/test.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

/**
 * Runs once before the whole test suite: pushes the schema to a throwaway
 * SQLite file so repository/service tests exercise a real database instead
 * of mocks, without touching the dev database. Vitest doesn't load .env by
 * default, so DATABASE_URL is set here via `test.env` in vitest.config.ts.
 */
export default async function setup() {
  if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);

  execSync("npx prisma db push --accept-data-loss", {
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });

  return () => {
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);
    const journal = `${TEST_DB_PATH}-journal`;
    if (existsSync(journal)) unlinkSync(journal);
  };
}
