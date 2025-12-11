import { compare, hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { signupFullSchema } from "@/validations/auth";
import { signInSchema } from "@/validations/signin.schema";

export const authRouter = router({
  signup: publicProcedure.input(signupFullSchema).mutation(async ({ ctx, input }) => {
    const { name, email, password, orgName, slug } = input;

    const existsUser = await ctx.prisma.user.findUnique({ where: { email } });
    if (existsUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "E-mail já cadastrado",
      });
    }

    const existsSlug = await ctx.prisma.organization.findUnique({
      where: { slug },
    });
    if (existsSlug) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Slug indisponível",
      });
    }

    const passwordHash = await hash(password, 12);

    const user = await ctx.prisma.user.create({
      data: { name, email, password: passwordHash },
      select: { id: true },
    });

    const org = await ctx.prisma.organization.create({
      data: { name: orgName, slug },
      select: { id: true },
    });

    await ctx.prisma.organizationMember.create({
      data: { orgId: org.id, userId: user.id, isOwner: true },
    });

    await ctx.prisma.user.update({
      where: { id: user.id },
      data: { activeOrgId: org.id },
    });

    return { email, password };
  }),

  signin: publicProcedure.input(signInSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Credenciais inválidas",
      });
    }

    const ok = await compare(input.password, user.password);
    if (!ok) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Credenciais inválidas",
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      activeOrgId: user.activeOrgId,
    };
  }),
});
