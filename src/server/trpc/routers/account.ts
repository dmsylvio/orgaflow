import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { userEmailPreferences, users } from "@/server/db/schemas";
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

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      emailVerified: row.emailVerified,
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

  updatePassword: protectedProcedure
    .input(
      z
        .object({
          currentPassword: z.string().min(1),
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

      const row = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, password: true },
      });

      if (!row) {
        throw new Error("User not found.");
      }

      const valid = await compare(input.currentPassword, row.password);
      if (!valid) {
        throw new Error("Current password is incorrect.");
      }

      const hashed = await hash(input.newPassword, 12);

      await ctx.db
        .update(users)
        .set({ password: hashed, updatedAt: new Date() })
        .where(eq(users.id, userId));

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
        await ctx.db
          .insert(userEmailPreferences)
          .values({ userId, ...input });
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
