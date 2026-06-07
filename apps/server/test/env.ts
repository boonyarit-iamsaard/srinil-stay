import { inject } from "vitest";

// Point the eager db/auth singletons at the Testcontainers Postgres BEFORE any
// app module is imported. This file must be the first setupFile and must not
// import any app code (which would build a db connection from the wrong URL).
process.env.DATABASE_URL = inject("databaseUrl");
