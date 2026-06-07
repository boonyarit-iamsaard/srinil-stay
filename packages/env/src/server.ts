import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z
      .string()
      .min(1)
      .transform((value) => value.split(",").map((origin) => origin.trim()))
      .pipe(z.array(z.url())),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    MAIL_FROM: z.string().min(1),
    BACK_OFFICE_URL: z.url(),
    // First-Staff bootstrap (opt-in). When both are set, the server issues a
    // Staff invitation for this person on startup. See ADR 0004.
    BOOTSTRAP_STAFF_EMAIL: z.email().optional(),
    BOOTSTRAP_STAFF_NAME: z.string().min(2).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
