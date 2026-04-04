import "server-only";

import { compareSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import Credentials from "next-auth/providers/credentials";
import { db } from "../db";
import { users } from "../db/schemas";

export const credentialsProvider = Credentials({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const email = credentials?.email as string;
    const password = credentials?.password as string;

    if (!email || !password) return null;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user || !compareSync(password, user.password)) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? undefined,
    };
  },
});
