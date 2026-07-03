import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "node:path";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Point it at a dedicated test Postgres database (see .env.example) " +
      "— tests never reuse DATABASE_URL, since vitest.global-setup.ts wipes whatever database this points at.",
  );
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./vitest.global-setup.ts"],
    // All test files share one dedicated Postgres test database (see
    // vitest.global-setup.ts). Kept sequential rather than parallel so
    // tests reading aggregate/table-wide state (e.g. finance summaries,
    // the module registry) can't observe another file's in-flight writes.
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
