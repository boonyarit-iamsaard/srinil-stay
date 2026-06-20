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

/**
 * The canonical sentence for each invitation status. This is the single home
 * for invitation status language — the API, the accept page, and the create
 * form all read from here so the words can never drift apart.
 */
export const INVITATION_STATUS_MESSAGES = {
  [INVITATION_STATUS.PENDING]: "Invitation is pending",
  [INVITATION_STATUS.ACCEPTED]: "Invitation has already been accepted",
  [INVITATION_STATUS.EXPIRED]: "Invitation has expired",
  [INVITATION_STATUS.MISSING]: "Invitation was not found",
  [INVITATION_STATUS.EXISTING_USER]: "An account already exists for this email",
} as const satisfies Record<InvitationStatus, string>;

export function invitationStatusMessage(status: InvitationStatus): string {
  return INVITATION_STATUS_MESSAGES[status];
}
