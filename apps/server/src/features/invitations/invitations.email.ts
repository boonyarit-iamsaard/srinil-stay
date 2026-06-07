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

export async function sendInvitationEmail(invitation: {
  email: string;
  name: string;
  token: string;
}) {
  const acceptUrl = `${env.BACK_OFFICE_URL}/invitations/accept?token=${invitation.token}`;

  await sendMail({
    to: invitation.email,
    subject: "You've been invited to Srinil Stay",
    html: `
      <p>Hi ${escapeHtml(invitation.name)},</p>
      <p>You've been invited to join the Srinil Stay team. Set a password to
      activate your account:</p>
      <p><a href="${acceptUrl}">Accept your invitation</a></p>
      <p>This link expires in 12 hours.</p>
    `,
  });
}
