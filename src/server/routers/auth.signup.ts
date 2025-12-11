import { router, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { signupFullSchema } from "@/validations/auth";

export const authSignupRouter = router({
  signupAndBoot: publicProcedure
    .input(signupFullSchema)
    .mutation(async ({ input }) => {
      const { name, email, password, orgName, slug } = input;

      const existsUser = await prisma.user.findUnique({ where: { email } });
      if (existsUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "E-mail já cadastrado",
        });
      }

      const existsSlug = await prisma.organization.findUnique({
        where: { slug },
      });
      if (existsSlug) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Slug indisponível",
        });
      }

      const passwordHash = await hash(password, 12);

      // cria usuário
      const user = await prisma.user.create({
        data: { name, email, password: passwordHash },
        select: { id: true },
      });

      // cria organização
      const org = await prisma.organization.create({
        data: { name: orgName, slug },
        select: { id: true },
      });

      // membership como owner
      await prisma.organizationMember.create({
        data: { orgId: org.id, userId: user.id, isOwner: true },
      });

      // define activeOrgId
      await prisma.user.update({
        where: { id: user.id },
        data: { activeOrgId: org.id },
      });

      // retorna credenciais para o cliente autenticar via NextAuth credentials
      return { email, password };
    }),
});
