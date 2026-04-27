import "server-only";

import { Resend } from "resend";

let cachedClient: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

function getAllUsersAudienceId(): string | null {
  return process.env.RESEND_AUDIENCE_ALL_USERS_ID?.trim() ?? null;
}

export async function syncContactToAllUsersAudience(params: {
  email: string;
  firstName: string;
  unsubscribed?: boolean;
}): Promise<void> {
  const client = getClient();
  const audienceId = getAllUsersAudienceId();

  if (!client || !audienceId) {
    return;
  }

  await client.contacts.create({
    audienceId,
    email: params.email,
    firstName: params.firstName,
    unsubscribed: params.unsubscribed ?? false,
  });
}
