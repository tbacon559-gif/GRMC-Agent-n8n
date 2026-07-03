import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./vitest.global-setup.ts"],
    // Several test files share one throwaway SQLite file (see
    // vitest.global-setup.ts). SQLite allows only one writer at a time, so
    // file-level parallelism is disabled to avoid intermittent SQLITE_BUSY
    // errors — this suite is small enough that running sequentially costs
    // a couple of seconds, not worth the complexity of per-file databases.
    fileParallelism: false,
    env: {
      DATABASE_URL: `file:${path.resolve(__dirname, "prisma/test.db")}`,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
