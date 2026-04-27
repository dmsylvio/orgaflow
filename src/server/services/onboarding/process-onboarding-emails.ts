import "server-only";

import { and, eq, isNull, lte, or } from "drizzle-orm";
import { db } from "@/server/db";
import { userEmailPreferences, users } from "@/server/db/schemas";
import {
  sendOnboardingD1Email,
  sendOnboardingD3Email,
} from "@/server/services/email/onboarding";

const D1_DELAY_MS = 24 * 60 * 60 * 1000;
const D3_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

export async function processOnboardingEmails(): Promise<void> {
  const now = new Date();
  const d1Threshold = new Date(now.getTime() - D1_DELAY_MS);
  const d3Threshold = new Date(now.getTime() - D3_DELAY_MS);

  const rows = await db
    .select({
      userId: userEmailPreferences.userId,
      onboardingD1SentAt: userEmailPreferences.onboardingD1SentAt,
      onboardingD3SentAt: userEmailPreferences.onboardingD3SentAt,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(userEmailPreferences)
    .innerJoin(users, eq(users.id, userEmailPreferences.userId))
    .where(
      and(
        eq(userEmailPreferences.emailTips, true),
        or(
          isNull(userEmailPreferences.onboardingD1SentAt),
          isNull(userEmailPreferences.onboardingD3SentAt),
        ),
      ),
    );

  for (const row of rows) {
    // D+1 email
    if (!row.onboardingD1SentAt && row.createdAt <= d1Threshold) {
      try {
        await sendOnboardingD1Email({ email: row.email, name: row.name });
        await db
          .update(userEmailPreferences)
          .set({ onboardingD1SentAt: now, updatedAt: now })
          .where(eq(userEmailPreferences.userId, row.userId));
      } catch (err) {
        console.error("[onboarding] Failed to send D+1 email", {
          userId: row.userId,
          err,
        });
      }
    }

    // D+3 email — only after D+1 has been sent
    if (
      row.onboardingD1SentAt &&
      !row.onboardingD3SentAt &&
      row.createdAt <= d3Threshold
    ) {
      try {
        await sendOnboardingD3Email({ email: row.email, name: row.name });
        await db
          .update(userEmailPreferences)
          .set({ onboardingD3SentAt: now, updatedAt: now })
          .where(eq(userEmailPreferences.userId, row.userId));
      } catch (err) {
        console.error("[onboarding] Failed to send D+3 email", {
          userId: row.userId,
          err,
        });
      }
    }
  }
}
