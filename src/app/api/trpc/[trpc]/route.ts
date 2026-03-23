import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/root";

function logDevError(path: string | undefined, error: unknown) {
  console.error(`[tRPC] ${path ?? "<no-path>"} failed:`, error);
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
      }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => logDevError(path, error)
        : undefined,
    responseMeta() {
      return {
        headers: {
          "Cache-Control": "no-store",
        },
      };
    },
  });

export { handler as GET, handler as POST };
