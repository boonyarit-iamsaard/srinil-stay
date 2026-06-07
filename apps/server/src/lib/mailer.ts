import { env } from "@srinil-stay/env/server";
import nodemailer from "nodemailer";

// In local dev this points at Mailpit (see compose.yaml); in production the
// SMTP_* env vars swap to a real relay with no code change.
const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
});

export async function sendMail(message: {
  to: string;
  subject: string;
  html: string;
}) {
  await transport.sendMail({ from: env.MAIL_FROM, ...message });
}
