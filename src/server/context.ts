import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await getServerSession(authOptions);
  return {
    headers: opts.headers,
    session,
    prisma,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
