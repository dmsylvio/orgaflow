import NextAuth from "next-auth";

/**
 * Edge-safe Auth.js instance, used only by `middleware.ts`.
 *
 * It must not import the DB adapter, `bcryptjs` or the credentials provider:
 * those depend on Node APIs (`pg`, `node:crypto`, ...) that are unavailable in
 * the Edge runtime. Sessions use the JWT strategy, so decoding the session
 * cookie only requires the shared `AUTH_SECRET`.
 */
export const { auth } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
