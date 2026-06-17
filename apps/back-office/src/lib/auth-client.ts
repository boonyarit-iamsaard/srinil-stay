import { env } from "@srinil-stay/env/back-office";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [adminClient()],
});
