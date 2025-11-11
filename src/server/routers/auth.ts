import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { signupUserSchema } from "@/validations/signup.schema";
import { publicProcedure, router } from "../trpc";

export const authRouter = router({
  signup: publicProcedure
    .input(signupUserSchema)
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "E-mail já cadastrado.",
        });
      }

      const passwordHash = await hash(input.password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      return { user };
    }),
});
