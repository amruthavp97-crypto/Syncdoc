import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || undefined,
  port: Number(env.SMTP_PORT) || 587,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!env.SMTP_HOST) {
    // No SMTP configured (common in local dev) - log instead of throwing,
    // so auth flows remain testable without a real mail provider.
    console.log(`[email:dev-mode] to=${to} subject="${subject}"\n${html}\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    // A misconfigured or unreachable SMTP provider must never break the
    // core flow that triggered this email (register, password reset,
    // workspace invite). Log loudly and continue - the user-facing
    // consequence is "no email arrived", not "the request failed".
    console.warn(
      `[email] send failed (to=${to}, subject="${subject}"): ${err instanceof Error ? err.message : err}`
    );
  }
}

export function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${env.CLIENT_URL}/verify-email?token=${token}`;
  return send(
    to,
    "Verify your SyncDoc email",
    `<p>Welcome to SyncDoc. Verify your email to get started:</p>
     <p><a href="${link}">${link}</a></p>`
  );
}

export function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
  return send(
    to,
    "Reset your SyncDoc password",
    `<p>Reset your password using the link below. This link expires in 1 hour.</p>
     <p><a href="${link}">${link}</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>`
  );
}

export function sendWorkspaceInviteEmail(
  to: string,
  workspaceName: string,
  token: string
): Promise<void> {
  const link = `${env.CLIENT_URL}/invite/accept?token=${token}`;
  return send(
    to,
    `You've been invited to join ${workspaceName} on SyncDoc`,
    `<p>You've been invited to collaborate on <strong>${workspaceName}</strong>.</p>
     <p><a href="${link}">${link}</a></p>`
  );
}
