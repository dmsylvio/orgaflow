import "server-only";

import type { NextAuthConfig } from "next-auth";
import { authAdapter } from "./adapter";
import { credentialsProvider } from "./credentials";
import { isJWTSessionError } from "./errors";

export default {
  pages: {
    signIn: "/login",
  },
  adapter: authAdapter,
  session: {
    strategy: "jwt",
  },
  providers: [credentialsProvider],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  logger: {
    error(error) {
      if (isJWTSessionError(error)) {
        return;
      }

      console.error(error);
    },
  },
} satisfies NextAuthConfig;
