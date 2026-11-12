import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/server/auth/auth";
import { authAccounts, userEmailPreferences, users } from "@/server/db/schemas";
import { syncContactToAllUsersAudience } from "@/server/services/email/audiences";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  image: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
});

export const accountRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = getSessionUserId(ctx);
    const row = await ctx.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!row) {
      return null;
    }

    const credential = await ctx.db.query.authAccounts.findFirst({
      where: and(
        eq(authAccounts.userId, userId),
        eq(authAccounts.providerId, "credential"),
      ),
      columns: { password: true },
    });

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      emailVerified: row.emailVerified,
      /** False for accounts that only ever signed in with an email link. */
      hasPassword: Boolean(credential?.password),
    };
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const patch: {
        name?: string;
        image?: string | null;
        updatedAt: Date;
      } = { updatedAt: new Date() };

      if (input.name !== undefined) {
        patch.name = input.name;
      }
      if (input.image !== undefined) {
        patch.image = input.image === "" ? null : input.image;
      }

      await ctx.db.update(users).set(patch).where(eq(users.id, userId));

      return { ok: true as const };
    }),

  /**
   * Changes the password, or sets a first one for accounts created with an
   * email link (those have no current password to confirm).
   */
  updatePassword: protectedProcedure
    .input(
      z
        .object({
          currentPassword: z.string().optional(),
          newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters"),
          confirmPassword: z.string().min(1),
        })
        .refine((d) => d.newPassword === d.confirmPassword, {
          message: "Passwords do not match",
          path: ["confirmPassword"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);

      const credential = await ctx.db.query.authAccounts.findFirst({
        where: and(
          eq(authAccounts.userId, userId),
          eq(authAccounts.providerId, "credential"),
        ),
        columns: { password: true },
      });

      try {
        if (credential?.password) {
          if (!input.currentPassword) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Enter your current password.",
            });
          }
          await auth.api.changePassword({
            headers: ctx.headers,
            body: {
              currentPassword: input.currentPassword,
              newPassword: input.newPassword,
              revokeOtherSessions: true,
            },
          });
        } else {
          await auth.api.setPassword({
            headers: ctx.headers,
            body: { newPassword: input.newPassword },
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        const message =
          error instanceof Error && /invalid password/i.test(error.message)
            ? "Current password is incorrect."
            : "Couldn't update your password. Please try again.";
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }

      return { ok: true as const };
    }),

  getEmailPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = getSessionUserId(ctx);
    const row = await ctx.db.query.userEmailPreferences.findFirst({
      where: eq(userEmailPreferences.userId, userId),
    });
    return {
      emailProductUpdates: row?.emailProductUpdates ?? true,
      emailTips: row?.emailTips ?? true,
    };
  }),

  updateEmailPreferences: protectedProcedure
    .input(
      z.object({
        emailProductUpdates: z.boolean(),
        emailTips: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);

      const existing = await ctx.db.query.userEmailPreferences.findFirst({
        where: eq(userEmailPreferences.userId, userId),
        columns: { id: true },
      });

      const now = new Date();
      if (existing) {
        await ctx.db
          .update(userEmailPreferences)
          .set({ ...input, updatedAt: now })
          .where(eq(userEmailPreferences.userId, userId));
      } else {
        await ctx.db.insert(userEmailPreferences).values({ userId, ...input });
      }

      // Sync unsubscribed status to Resend audience.
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true, name: true },
      });
      if (user) {
        const unsubscribed = !input.emailProductUpdates && !input.emailTips;
        syncContactToAllUsersAudience({
          email: user.email,
          firstName: user.name.split(" ")[0] ?? user.name,
          unsubscribed,
        }).catch(() => {});
      }

      return { ok: true as const };
    }),
});
