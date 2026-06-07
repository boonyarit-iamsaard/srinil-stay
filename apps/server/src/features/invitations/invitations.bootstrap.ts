import { createInvitation } from "./invitations.service";

/**
 * Provision the declared first Staff member on server startup. Issues a Staff
 * invitation for the configured person (no-op if they are already a user). See
 * ADR 0004.
 */
export async function bootstrapStaff(config: {
  email?: string;
  name?: string;
}): Promise<void> {
  const { email, name } = config;
  if (!(email && name)) {
    return;
  }

  // Best-effort: a failure here (e.g. SMTP down) must never block server boot.
  try {
    await createInvitation({ email, name });
  } catch (error) {
    // Best-effort: log a concise reason (not the full stack) and let boot
    // continue. The invitation is re-attempted on the next start.
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `First-Staff bootstrap: could not email an invitation to ${email} (${reason}); server starting anyway.`
    );
  }
}
