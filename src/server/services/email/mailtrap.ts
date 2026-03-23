import "server-only";

import { type Address, MailtrapClient } from "mailtrap";

let cachedClient: MailtrapClient | null = null;

function getMailtrapApiToken(): string {
  const token = process.env.MAILTRAP_API_TOKEN?.trim();
  if (!token) {
    throw new Error("MAILTRAP_API_TOKEN is not configured.");
  }

  return token;
}

function getFromEmail(): string {
  const from = process.env.MAILTRAP_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error("MAILTRAP_FROM_EMAIL is not configured.");
  }

  return from;
}

function getReplyToEmail(): string | undefined {
  const replyTo = process.env.MAILTRAP_REPLY_TO_EMAIL?.trim();
  return replyTo || undefined;
}

function isSandboxEnabled(): boolean {
  const value = process.env.MAILTRAP_SANDBOX?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function getTestInboxId(): number | undefined {
  const rawValue = process.env.MAILTRAP_TEST_INBOX_ID?.trim();
  if (!rawValue) return undefined;

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("MAILTRAP_TEST_INBOX_ID must be a positive integer.");
  }

  return parsed;
}

function parseMailbox(input: string): Address {
  const trimmed = input.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);

  if (!match) {
    return { email: trimmed };
  }

  const [, rawName, rawEmail] = match;
  const name = rawName.trim().replace(/^"|"$/g, "");
  const email = rawEmail.trim();

  return name ? { email, name } : { email };
}

function getClient(): MailtrapClient {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new MailtrapClient({
    token: getMailtrapApiToken(),
    sandbox: isSandboxEnabled(),
    testInboxId: getTestInboxId(),
  });

  return cachedClient;
}

function buildMailtrapErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Mailtrap could not send the email.";
}

export async function sendTransactionalEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) {
  const client = getClient();
  const from = parseMailbox(getFromEmail());
  const to = (Array.isArray(params.to) ? params.to : [params.to]).map(
    parseMailbox,
  );
  const replyTo = getReplyToEmail();

  try {
    return await client.send({
      from,
      to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      ...(replyTo ? { reply_to: parseMailbox(replyTo) } : {}),
    });
  } catch (error) {
    throw new Error(buildMailtrapErrorMessage(error));
  }
}
