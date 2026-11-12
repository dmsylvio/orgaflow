import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";
import { isNextDynamicServerUsageError } from "./errors";

/** The signed-in user and session, or `null`. */
export type CurrentSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export async function getCurrentSession(): Promise<CurrentSession | null> {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    if (isNextDynamicServerUsageError(error)) {
      throw error;
    }

    console.error("[auth] failed to load current session", error);
    return null;
  }
}
