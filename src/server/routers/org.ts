import z from "zod";
import { assertOrgMembership } from "../iam/guards/requireMember";
import { assertOrgResolved } from "../iam/guards/requireOrg";
import { protectedProcedure, router } from "../trpc";

export const orgRouter = router({
   current: protectedProcedure.query(async({ ctx }) => {
      const orgId = assertOrgResolved(ctx.orgId);
      await assertOrgMembership(orgId, ctx.session!.user.id);

      const org = await ctx.prisma.organization.findUnique({
         where: { id: orgId },
         select: {
            id: true,
            name: true,
            slug: true
         }
      })

      return org;
   }),

   listMine: protectedProcedure.query(async ({ctx}) => {
      const rows = await ctx.prisma.organizationMember.findMany({
         where: { userId: ctx.session!.user.id },
         select: {
            isOwner: true,
            org: {
               select: {
                  id: true,
                  name: true,
                  slug: true
               }
            }
         },
         orderBy: {
            createdAt: 'asc'
         }
      })

      return rows.map((row) => ({
         ...row.org,
         isOwner: row.isOwner
      }));
   }),

   switch: protectedProcedure.input(z.object({
      orgId: z.uuid()
   })).mutation(async ({ctx, input}) => {
      await assertOrgMembership(input.orgId, ctx.session!.user.id);
      await ctx.prisma.user.update({
         where: { id: ctx.session!.user.id },
         data: { activeOrgId: input.orgId }
      })
      return { ok: true };
   }),

   create: protectedProcedure.input(z.object({
      name: z.string().min(2),
      slug: z.string().optional(),
   })).mutation(async ({ ctx, input }) => {
      const base = (input.name ?? input.name)
      .toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
      let slug = base || "org";
      for (let i = 2; await ctx.prisma.organization.findUnique({ where: { slug } }); i++)
         slug = `${base}-${i}`;

      const userId = ctx.session!.user.id;

      const org = await ctx.prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: { name: input.name, slug },
          select: { id: true, name: true, slug: true },
        });
        await tx.organizationMember.create({
          data: { orgId: org.id, userId, isOwner: true },
        });
        await tx.user.update({
          where: { id: userId },
          data: { activeOrgId: org.id },
        });
        return org;
      });

      return { org };
   })
});