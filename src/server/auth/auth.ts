import "server-only";

import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { and, eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { getAppBaseUrl } from "@/lib/base-url";
import { db } from "@/server/db";
import {
  authAccounts,
  authSessions,
  authVerifications,
  userEmailPreferences,
  users,
} from "@/server/db/schemas";
import { syncContactToAllUsersAudience } from "@/server/services/email/audiences";
import {
  sendMagicLinkEmail,
  sendPasswordResetEmail,
} from "@/server/services/email/auth-emails";
import { sendWelcomeEmail } from "@/server/services/email/welcome";

/** Existing password hashes are bcrypt (from the NextAuth era), so keep bcrypt. */
const BCRYPT_ROUNDS = 12;
const MAGIC_LINK_TTL_SECONDS = 15 * 60;

/**
 * Sends an auth email. Without Resend configured (local dev), the link is
 * printed to the server log instead so the flow can still be tested.
 */
async function deliverAuthEmail(
  kind: "magic-link" | "password-reset",
  email: string,
  url: string,
  send: () => Promise<void>,
) {
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
    console.info(`[auth] ${kind} link for ${email}: ${url}`);
    return;
  }

  try {
    await send();
  } catch (error) {
    // Usually RESEND_API_KEY / RESEND_FROM_EMAIL missing or an unverified domain.
    console.error(`[auth] Failed to send ${kind} email`, {
      to: email,
      error: error instanceof Error ? error.message : error,
    });
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message:
        "We couldn't send the email right now. Please try again in a few minutes.",
    });
  }
}

/**
 * Self-healing for accounts from the NextAuth era: if a user still has their
 * bcrypt hash only in `users.password` (e.g. the database was updated with
 * `db:push`, which skips the data copy in migration 0019), copy it into a
 * Better Auth credential account right before the password sign-in runs.
 */
async function ensureLegacyCredentialAccount(rawEmail: unknown) {
  if (typeof rawEmail !== "string" || !rawEmail.trim()) return;
  const email = rawEmail.trim().toLowerCase();

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, password: true },
    });
    if (!user?.password) return;

    const existing = await db.query.authAccounts.findFirst({
      where: and(
        eq(authAccounts.userId, user.id),
        eq(authAccounts.providerId, "credential"),
      ),
      columns: { id: true },
    });
    if (existing) return;

    await db.insert(authAccounts).values({
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: user.password,
    });
    console.info("[auth] Migrated legacy password for user", user.id);
  } catch (error) {
    console.error("[auth] Legacy password migration failed", { error });
  }
}

export const auth = betterAuth({
  appName: "Orgaflow",
  baseURL: getAppBaseUrl(),
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  advanced: {
    database: {
      generateId: () => uuidv7(),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: (password) => hash(password, BCRYPT_ROUNDS),
      verify: ({ hash: stored, password }) => compare(password, stored),
    },
    sendResetPassword: async ({ user, url }) => {
      await deliverAuthEmail("password-reset", user.email, url, () =>
        sendPasswordResetEmail({ email: user.email, url }),
      );
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        await ensureLegacyCredentialAccount(ctx.body?.email);
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.trim().toLowerCase();
          // Magic-link sign-ups from the login page arrive without a name.
          const name = user.name?.trim() || email.split("@")[0] || "New user";
          return { data: { ...user, email, name } };
        },
        after: async (user) => {
          // Bootstrap email preferences, then welcome email + audience sync.
          // None of this may block the sign-up itself.
          try {
            await db
              .insert(userEmailPreferences)
              .values({ userId: user.id })
              .onConflictDoNothing();
          } catch (error) {
            console.error("[auth] Could not create email preferences", {
              userId: user.id,
              error,
            });
          }

          const firstName = user.name.split(" ")[0] || user.name;
          Promise.all([
            sendWelcomeEmail({ email: user.email, name: user.name }),
            syncContactToAllUsersAudience({ email: user.email, firstName }),
          ]).catch((error) =>
            console.error("[auth] Post-registration email failed", { error }),
          );
        },
      },
    },
  },
  plugins: [
    magicLink({
      expiresIn: MAGIC_LINK_TTL_SECONDS,
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        await deliverAuthEmail("magic-link", email, url, () =>
          sendMagicLinkEmail({ email, url }),
        );
      },
    }),
    // Must stay last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
