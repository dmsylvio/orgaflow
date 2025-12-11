import { createTRPCContext } from "./context";
import { appRouter } from "./root";

/**
 * Cria um caller do tRPC já com o contexto do Next (session, prisma, orgId, etc).
 * Use apenas em rotas/server components/server actions.
 */
export async function getServerCaller() {
  const ctx = await createTRPCContext();
  return appRouter.createCaller(ctx);
}
