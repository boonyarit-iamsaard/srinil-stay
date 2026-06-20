export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "expired",
  "missing",
  "existing-user",
] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  EXPIRED: "expired",
  MISSING: "missing",
  EXISTING_USER: "existing-user",
} as const satisfies Record<string, InvitationStatus>;

export type InvitationLifecycleStatus = Exclude<
  InvitationStatus,
  "existing-user"
>;

interface InvitationLifecycleInput {
  acceptedAt: Date | null;
  expiresAt: Date;
}

export function invitationLifecycleStatus(
  invitation: InvitationLifecycleInput | null | undefined,
  now = new Date()
): InvitationLifecycleStatus {
  if (!invitation) {
    return INVITATION_STATUS.MISSING;
  }

  if (invitation.acceptedAt) {
    return INVITATION_STATUS.ACCEPTED;
  }

  if (invitation.expiresAt <= now) {
    return INVITATION_STATUS.EXPIRED;
  }

  return INVITATION_STATUS.PENDING;
}
