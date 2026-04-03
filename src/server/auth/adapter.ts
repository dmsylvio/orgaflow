import "server-only";

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import { db } from "../db";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "../db/schemas";

export const authAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
  authenticatorsTable: authenticators,
}) as NextAuthConfig["adapter"];
