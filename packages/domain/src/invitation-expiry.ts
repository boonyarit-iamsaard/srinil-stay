const EXPIRY_HOURS = 12;
const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * The single home for the invitation expiry policy — the duration and the
 * human label live together so the machine value and the prose shown to people
 * can never disagree. Change the window here and both update.
 */
export const INVITATION_EXPIRY = {
  hours: EXPIRY_HOURS,
  durationMs: EXPIRY_HOURS * MS_PER_HOUR,
  humanLabel: `${EXPIRY_HOURS} hours`,
} as const;

export function invitationExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITATION_EXPIRY.durationMs);
}
