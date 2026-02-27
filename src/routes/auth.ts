import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { Elysia } from "elysia";
import { db, schema } from "../db";
import { signJwt } from "../modules/auth";
import { badRequest, conflict, json, unauthorized } from "../lib/http";
import { signinSchema, signupSchema } from "../validation";

export function registerAuthRoutes(app: Elysia) {
  return app
    .post("/auth/register", async ({ body }) => {
      try {
        const input = signupSchema.parse(body);

        const exists = await db
          .select({ id: schema.user.id })
          .from(schema.user)
          .where(eq(schema.user.email, input.email))
          .limit(1);

        if (exists[0]) return conflict("Email already in use");

        const password = await bcrypt.hash(input.password, 12);

        const [createdUser] = await db
          .insert(schema.user)
          .values({
            name: input.name,
            email: input.email,
            password,
            emailVerified: true,
          })
          .returning({
            id: schema.user.id,
            email: schema.user.email,
            name: schema.user.name,
          });

        if (!createdUser) return json({ error: "Failed to create user" }, 500);

        const [createdOrg] = await db
          .insert(schema.organization)
          .values({ name: input.orgName, slug: input.slug })
          .returning({
            id: schema.organization.id,
            name: schema.organization.name,
            slug: schema.organization.slug,
          });

        if (!createdOrg)
          return json({ error: "Failed to create organization" }, 500);

        await db.insert(schema.organizationMember).values({
          orgId: createdOrg.id,
          userId: createdUser.id,
          isOwner: true,
        });

        await db
          .update(schema.user)
          .set({ activeOrgId: createdOrg.id })
          .where(eq(schema.user.id, createdUser.id));

        const token = signJwt({
          sub: createdUser.id,
          email: createdUser.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        });

        return { token, user: createdUser, org: createdOrg };
      } catch {
        return badRequest();
      }
    })
    .post("/auth/login", async ({ body }) => {
      try {
        const input = signinSchema.parse(body);

        const rows = await db
          .select({
            id: schema.user.id,
            email: schema.user.email,
            name: schema.user.name,
            password: schema.user.password,
          })
          .from(schema.user)
          .where(eq(schema.user.email, input.email))
          .limit(1);

        const found = rows[0];
        if (!found) return unauthorized("Invalid credentials");

        const ok = await bcrypt.compare(input.password, found.password);
        if (!ok) return unauthorized("Invalid credentials");

        const token = signJwt({
          sub: found.id,
          email: found.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        });

        return {
          token,
          user: { id: found.id, email: found.email, name: found.name },
        };
      } catch {
        return badRequest();
      }
    });
}
