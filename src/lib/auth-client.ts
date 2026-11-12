"use client";

import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Browser client for Better Auth (same origin, `/api/auth`). */
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export const { useSession } = authClient;

/** Signs out and sends the user to `redirectTo` (home by default). */
export async function signOutAndRedirect(redirectTo = "/") {
  await authClient.signOut();
  window.location.assign(redirectTo);
}
