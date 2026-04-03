import NextAuth from "next-auth";
import authConfig from "@/server/auth/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }

      return session;
    },
  },
});
