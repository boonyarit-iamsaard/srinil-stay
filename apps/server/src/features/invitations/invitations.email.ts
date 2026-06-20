import { INVITATION_EXPIRY } from "@srinil-stay/domain/invitation-expiry";
import { env } from "@srinil-stay/env/server";

import { sendMail } from "../../lib/mailer";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildInvitationAcceptUrl(input: {
  token: string;
  backOfficeUrl?: string;
}): string {
  const acceptUrl = new URL(
    "/invitations/accept",
    input.backOfficeUrl ?? env.BACK_OFFICE_URL
  );
  acceptUrl.searchParams.set("token", input.token);
  return acceptUrl.toString();
}

export function renderInvitationEmail(input: {
  name: string;
  acceptUrl: string;
}) {
  return {
    subject: "You've been invited to Srinil Stay",
    html: `
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>You've been invited to join the Srinil Stay team. Set a password to
      activate your account:</p>
      <p><a href="${escapeHtml(input.acceptUrl)}">Accept your invitation</a></p>
      <p>This link expires in ${INVITATION_EXPIRY.humanLabel}.</p>
    `,
  };
}

export async function sendInvitationEmail(invitation: {
  email: string;
  name: string;
  token: string;
}) {
  const acceptUrl = buildInvitationAcceptUrl({ token: invitation.token });
  const message = renderInvitationEmail({
    name: invitation.name,
    acceptUrl,
  });

  await sendMail({
    to: invitation.email,
    ...message,
  });
}
