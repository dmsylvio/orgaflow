import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc/init";
import { accountRouter } from "@/server/trpc/routers/account";
import { automationsRouter } from "@/server/trpc/routers/automations";
import { customersRouter } from "@/server/trpc/routers/customers";
import { estimatesRouter } from "@/server/trpc/routers/estimates";
import { expensesRouter } from "@/server/trpc/routers/expenses";
import { iamRouter } from "@/server/trpc/routers/iam";
import { invoicesRouter } from "@/server/trpc/routers/invoices";
import { itemsRouter } from "@/server/trpc/routers/items";
import { paymentsRouter } from "@/server/trpc/routers/payments";
import { reportsRouter } from "@/server/trpc/routers/reports";
import { roleRouter } from "@/server/trpc/routers/role";
import { settingsRouter } from "@/server/trpc/routers/settings";
import { tasksRouter } from "@/server/trpc/routers/tasks";
import { teamRouter } from "@/server/trpc/routers/team";
import { workspaceRouter } from "@/server/trpc/routers/workspace";
import { buildViewerPayload } from "@/server/trpc/viewer";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    ok: true,
    now: new Date(),
  })),

  account: accountRouter,
  automations: automationsRouter,
  customers: customersRouter,
  estimates: estimatesRouter,
  expenses: expensesRouter,
  iam: iamRouter,
  invoices: invoicesRouter,
  items: itemsRouter,
  payments: paymentsRouter,
  reports: reportsRouter,
  role: roleRouter,
  settings: settingsRouter,
  tasks: tasksRouter,
  team: teamRouter,
  workspace: workspaceRouter,

  viewer: protectedProcedure.query(({ ctx }) => buildViewerPayload(ctx)),
});

export type AppRouter = typeof appRouter;
