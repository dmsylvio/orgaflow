import "server-only";
import { auth } from "../../../auth";
import { isJWTSessionError, isNextDynamicServerUsageError } from "./errors";

export async function getCurrentSession() {
  try {
    return await auth();
  } catch (error) {
    if (isJWTSessionError(error) || isNextDynamicServerUsageError(error)) {
      return null;
    }

    console.error("[auth] failed to load current session", error);
    return null;
  }
}
