import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Source only — `tsc -b` (types:check) emits compiled .test.js into dist/,
    // which must not be collected as a second copy of the suite.
    include: ["src/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    // Order matters: env.ts must run before setup.ts so DATABASE_URL points at
    // the container before any app module (which eagerly builds a db/auth
    // singleton from env) is imported.
    setupFiles: ["./test/env.ts", "./test/setup.ts"],
    // Run test files one at a time so the shared Testcontainers Postgres isn't
    // truncated by one file's beforeEach while another file is mid-test.
    fileParallelism: false,
    hookTimeout: 120_000, // container start and schema push on first run
    testTimeout: 30_000,
  },
});
