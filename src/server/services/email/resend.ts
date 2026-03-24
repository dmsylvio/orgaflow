import "server-only";

import { Resend } from "resend";

let cachedClient: Resend | null = null;

function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return apiKey;
}

function getFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  return from;
}

function getReplyToEmail(): string | undefined {
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim();
  return replyTo || undefined;
}

function getClient(): Resend {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new Resend(getResendApiKey());
  return cachedClient;
}

function buildResendErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Resend could not send the email.";
}

export async function sendTransactionalEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
}) {
  const client = getClient();
  const from = params.from?.trim() ? params.from.trim() : getFromEmail();
  const replyTo = getReplyToEmail();

  try {
    const result = await client.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      ...(replyTo ? { replyTo } : {}),
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    throw new Error(buildResendErrorMessage(error));
  }
}

