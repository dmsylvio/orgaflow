"use server";

import { randomBytes } from "node:crypto";
import { hashSync } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { getAppBaseUrl } from "@/lib/base-url";
import { forgotPasswordSchema } from "@/schemas/forgot-password";
import { registerSchema } from "@/schemas/register";
import { resetPasswordSchema } from "@/schemas/reset-password";
import { db } from "@/server/db";
import { userEmailPreferences, users, verificationTokens } from "@/server/db/schemas";
import { syncContactToAllUsersAudience } from "@/server/services/email/audiences";
import { sendWelcomeEmail } from "@/server/services/email/welcome";
import type { AuthActionResult } from "@/types/auth-actions";

const BCRYPT_ROUNDS = 12;
const PW_RESET_PREFIX = "pwreset:";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function passwordResetIdentifier(email: string): string {
  return `${PW_RESET_PREFIX}${email.trim().toLowerCase()}`;
}

function buildPasswordResetUrl(token: string): string {
  const url = new URL("/reset-password", getAppBaseUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function registerAction(
  input: unknown,
): Promise<AuthActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }

    const passwordHash = hashSync(parsed.data.password, BCRYPT_ROUNDS);

    const [created] = await db
      .insert(users)
      .values({
        name: parsed.data.name.trim(),
        email,
        password: passwordHash,
      })
      .returning({ id: users.id });

    if (!created) {
      return {
        success: false,
        message: "Could not create account",
      };
    }

    const userName = parsed.data.name.trim();

    // Bootstrap email preferences row for the new user.
    await db.insert(userEmailPreferences).values({ userId: created.id });

    // Fire-and-forget: welcome email + audience sync.
    Promise.all([
      sendWelcomeEmail({ email, name: userName }),
      syncContactToAllUsersAudience({ email, firstName: userName.split(" ")[0] ?? userName }),
    ]).catch((err) =>
      console.error("[auth/register] Post-registration email failed", { err }),
    );

    return { success: true, data: { userId: created.id } };
  } catch (error) {
    console.error("[auth/register] Failed to create account", {
      email,
      error,
    });

    return {
      success: false,
      message: "Could not create account. Please try again.",
    };
  }
}

export async function forgotPasswordAction(
  input: unknown,
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const identifier = passwordResetIdentifier(email);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db.insert(verificationTokens).values({
      identifier,
      token,
      expires,
    });

    const resetUrl = buildPasswordResetUrl(token);
    if (process.env.NODE_ENV === "development") {
      console.info("[auth] Password reset URL (dev only):", resetUrl);
    }
  }

  return { success: true };
}

export async function resetPasswordAction(
  input: unknown,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  const { token, password } = parsed.data;

  const rows = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token))
    .limit(5);

  const row = rows.find(
    (r) => r.identifier.startsWith(PW_RESET_PREFIX) && r.expires > new Date(),
  );

  if (!row) {
    return {
      success: false,
      message: "This reset link is invalid or has expired.",
    };
  }

  const email = row.identifier.slice(PW_RESET_PREFIX.length);
  const passwordHash = hashSync(password, BCRYPT_ROUNDS);
  const now = new Date();

  await db
    .update(users)
    .set({
      password: passwordHash,
      updatedAt: now,
    })
    .where(eq(users.email, email));

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, row.identifier),
        eq(verificationTokens.token, row.token),
      ),
    );

  return { success: true };
}
