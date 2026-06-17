import { auth } from "@srinil-stay/auth";
import { STAFF_ROLE } from "@srinil-stay/drizzle/schema/roles";
import { createMiddleware } from "hono/factory";

export const requireStaff = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (session.user.role !== STAFF_ROLE) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});
