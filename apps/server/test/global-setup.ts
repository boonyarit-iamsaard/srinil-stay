import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PostgreSqlContainer } from "@testcontainers/postgresql";

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
// apps/server/test -> repo root -> packages/drizzle
const drizzleDir = path.resolve(here, "../../../packages/drizzle");

export default async function setup({
  provide,
}: {
  provide: (key: "databaseUrl", value: string) => void;
}) {
  // Must match compose.yaml: schemas default ids with uuidv7(), which only
  // exists in Postgres 18.
  const container = await new PostgreSqlContainer("postgres:18-alpine").start();
  const databaseUrl = container.getConnectionUri();

  // Apply the schema with the project's own push command. drizzle.config.ts
  // loads apps/server/.env via dotenv, which does NOT override the DATABASE_URL
  // we inject here, so push targets the ephemeral container. A fresh empty DB
  // means push runs non-interactively (no data-loss prompt).
  execSync("pnpm exec drizzle-kit push", {
    cwd: drizzleDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });

  provide("databaseUrl", databaseUrl);

  return async () => {
    await container.stop();
  };
}
