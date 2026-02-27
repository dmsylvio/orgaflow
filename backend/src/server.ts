import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, schema } from "./db";
import { getOrgFromHost } from "./tenant";
import {
  createCustomerSchema,
  customerIdSchema,
  listCustomersSchema,
  orgCreateSchema,
  orgDeleteSchema,
  orgSwitchSchema,
  orgUpdateSchema,
  signinSchema,
  signupSchema,
  updateCustomerSchema,
} from "./validation";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "";

type Session = { userId: string; email: string } | null;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function signJwt(payload: { sub: string; email: string; exp: number }) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token: string) {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) throw new Error("invalid-token");

  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest();
  const provided = Buffer.from(signature, "base64url");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error("invalid-signature");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
    sub: string;
    email: string;
    exp: number;
  };

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("token-expired");
  }

  return payload;
}

async function resolveSession(authHeader?: string | null): Promise<Session> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7).trim();
    const payload = verifyJwt(token);
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

async function resolveOrgId(host: string | null, userId?: string) {
  const slug = getOrgFromHost(host, ROOT_DOMAIN);
  let orgId: string | null = null;

  if (slug) {
    const org = await db
      .select({ id: schema.organization.id })
      .from(schema.organization)
      .where(eq(schema.organization.slug, slug))
      .limit(1);
    orgId = org[0]?.id ?? null;
  }

  if (!orgId && userId) {
    const usr = await db
      .select({ activeOrgId: schema.user.activeOrgId })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);
    orgId = usr[0]?.activeOrgId ?? null;
  }

  if (orgId && userId) {
    const member = await db
      .select({ id: schema.organizationMember.id })
      .from(schema.organizationMember)
      .where(
        and(
          eq(schema.organizationMember.orgId, orgId),
          eq(schema.organizationMember.userId, userId),
        ),
      )
      .limit(1);
    if (!member[0]) return null;
  }

  return orgId;
}

async function requireAuth(request: Request): Promise<Session> {
  const session = await resolveSession(request.headers.get("authorization"));
  if (!session) throw new Error("unauthorized");
  return session;
}

async function requireOrg(request: Request, userId: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const orgId = await resolveOrgId(host, userId);
  if (!orgId) throw new Error("org-not-set");
  return orgId;
}

const app = new Elysia({ prefix: "/api" })
  .onRequest(({ set }) => {
    set.headers["access-control-allow-origin"] = "*";
    set.headers["access-control-allow-headers"] = "content-type, authorization";
    set.headers["access-control-allow-methods"] = "GET,POST,PATCH,DELETE,OPTIONS";
  })
  .options("/*", () => new Response(null, { status: 204 }))
  .get("/health", () => ({ ok: true }))
  .post("/auth/register", async ({ body }) => {
    try {
      const input = signupSchema.parse(body);

      const exists = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.email, input.email))
        .limit(1);

      if (exists[0]) return json({ error: "Email already in use" }, 409);

      const password = await bcrypt.hash(input.password, 12);

      const [createdUser] = await db
        .insert(schema.user)
        .values({
          name: input.name,
          email: input.email,
          password,
          emailVerified: true,
        })
        .returning({ id: schema.user.id, email: schema.user.email, name: schema.user.name });

      if (!createdUser) return json({ error: "Failed to create user" }, 500);

      const [createdOrg] = await db
        .insert(schema.organization)
        .values({ name: input.orgName, slug: input.slug })
        .returning({ id: schema.organization.id, name: schema.organization.name, slug: schema.organization.slug });

      if (!createdOrg) return json({ error: "Failed to create organization" }, 500);

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
      return json({ error: "Invalid payload" }, 400);
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
      if (!found) return json({ error: "Invalid credentials" }, 401);

      const ok = await bcrypt.compare(input.password, found.password);
      if (!ok) return json({ error: "Invalid credentials" }, 401);

      const token = signJwt({
        sub: found.id,
        email: found.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      });
      return { token, user: { id: found.id, email: found.email, name: found.name } };
    } catch {
      return json({ error: "Invalid payload" }, 400);
    }
  })
  .get("/me", async ({ request }) => {
    try {
      const session = await requireAuth(request);
      const orgId = await requireOrg(request, session.userId);
      const user = await db
        .select({
          id: schema.user.id,
          email: schema.user.email,
          name: schema.user.name,
          activeOrgId: schema.user.activeOrgId,
        })
        .from(schema.user)
        .where(eq(schema.user.id, session.userId))
        .limit(1);

      const membership = await db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, orgId),
            eq(schema.organizationMember.userId, session.userId),
          ),
        )
        .limit(1);

      return { ...user[0], membership: membership[0] ?? null };
    } catch (error) {
      if (error instanceof Error && error.message === "unauthorized") return json({ error: "Unauthorized" }, 401);
      if (error instanceof Error && error.message === "org-not-set") return json({ error: "Organization not set" }, 412);
      return json({ error: "Internal error" }, 500);
    }
  })
  .get("/me/permissions", async ({ request }) => {
    try {
      const session = await requireAuth(request);
      const orgId = await requireOrg(request, session.userId);
      const member = await db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(and(eq(schema.organizationMember.orgId, orgId), eq(schema.organizationMember.userId, session.userId)))
        .limit(1);
      const isOwner = member[0]?.isOwner === true;
      return isOwner
        ? ["*"]
        : ["dashboard:access", "customer:view", "customer:create", "customer:edit", "customer:delete"];
    } catch {
      return json({ error: "Unauthorized" }, 401);
    }
  })
  .get("/org", async ({ request }) => {
    try {
      const session = await requireAuth(request);
      const rows = await db
        .select({
          id: schema.organization.id,
          name: schema.organization.name,
          slug: schema.organization.slug,
          isOwner: schema.organizationMember.isOwner,
        })
        .from(schema.organizationMember)
        .innerJoin(schema.organization, eq(schema.organizationMember.orgId, schema.organization.id))
        .where(eq(schema.organizationMember.userId, session.userId));
      return rows;
    } catch {
      return json({ error: "Unauthorized" }, 401);
    }
  })
  .get("/org/current", async ({ request }) => {
    try {
      const session = await requireAuth(request);
      const orgId = await requireOrg(request, session.userId);
      const org = await db
        .select({ id: schema.organization.id, name: schema.organization.name, slug: schema.organization.slug })
        .from(schema.organization)
        .where(eq(schema.organization.id, orgId))
        .limit(1);
      if (!org[0]) return json({ error: "Organization not found" }, 404);
      return org[0];
    } catch {
      return json({ error: "Unauthorized" }, 401);
    }
  })
  .post("/org/switch", async ({ request, body }) => {
    try {
      const session = await requireAuth(request);
      const input = orgSwitchSchema.parse(body);
      const member = await db
        .select({ id: schema.organizationMember.id })
        .from(schema.organizationMember)
        .where(and(eq(schema.organizationMember.orgId, input.orgId), eq(schema.organizationMember.userId, session.userId)))
        .limit(1);
      if (!member[0]) return json({ error: "Forbidden" }, 403);

      await db.update(schema.user).set({ activeOrgId: input.orgId }).where(eq(schema.user.id, session.userId));
      return { ok: true };
    } catch {
      return json({ error: "Invalid payload" }, 400);
    }
  })
  .post("/org", async ({ request, body }) => {
    try {
      const session = await requireAuth(request);
      const input = orgCreateSchema.parse(body);
      const [org] = await db
        .insert(schema.organization)
        .values({ name: input.name, slug: input.slug })
        .returning({ id: schema.organization.id, name: schema.organization.name, slug: schema.organization.slug });
      if (!org) return json({ error: "Failed to create organization" }, 500);

      await db.insert(schema.organizationMember).values({ orgId: org.id, userId: session.userId, isOwner: true });
      await db.update(schema.user).set({ activeOrgId: org.id }).where(eq(schema.user.id, session.userId));
      return { org };
    } catch {
      return json({ error: "Invalid payload" }, 400);
    }
  })
  .patch("/org", async ({ request, body }) => {
    try {
      const session = await requireAuth(request);
      const input = orgUpdateSchema.parse(body);
      const member = await db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(and(eq(schema.organizationMember.orgId, input.orgId), eq(schema.organizationMember.userId, session.userId)))
        .limit(1);
      if (!member[0]?.isOwner) return json({ error: "Forbidden" }, 403);

      await db
        .update(schema.organization)
        .set({ name: input.name, slug: input.slug })
        .where(eq(schema.organization.id, input.orgId));
      return { org: { id: input.orgId, name: input.name, slug: input.slug } };
    } catch {
      return json({ error: "Invalid payload" }, 400);
    }
  })
  .delete("/org", async ({ request, body }) => {
    try {
      const session = await requireAuth(request);
      const input = orgDeleteSchema.parse(body);
      const member = await db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(and(eq(schema.organizationMember.orgId, input.orgId), eq(schema.organizationMember.userId, session.userId)))
        .limit(1);
      if (!member[0]?.isOwner) return json({ error: "Forbidden" }, 403);
      await db.delete(schema.organization).where(eq(schema.organization.id, input.orgId));
      return { ok: true };
    } catch {
      return json({ error: "Invalid payload" }, 400);
    }
  })
  .get("/customers", async ({ request, query }) => {
    try {
      const session = await requireAuth(request);
      const orgId = await requireOrg(request, session.userId);
      const input = listCustomersSchema.parse(query);

      const base = eq(schema.customer.orgId, orgId);
      const q = input.q?.trim();
      const where = q
        ? and(
            base,
            or(
              ilike(schema.customer.name, `%${q}%`),
              ilike(schema.customer.email, `%${q}%`),
              ilike(schema.customer.phone, `%${q}%`),
            ),
          )
        : base;

      const cursorWhere = input.cursor ? and(where, lt(schema.customer.id, input.cursor)) : where;

      const rows = await db
        .select({
          id: schema.customer.id,
          name: schema.customer.name,
          email: schema.customer.email,
          phone: schema.customer.phone,
          notes: schema.customer.notes,
          createdAt: schema.customer.createdAt,
          updatedAt: schema.customer.updatedAt,
        })
        .from(schema.customer)
        .where(cursorWhere)
        .orderBy(desc(schema.customer.createdAt))
        .limit(input.limit + 1);

      const items = rows.slice(0, input.limit);
      const nextCursor = rows.length > input.limit ? rows[input.limit]?.id : undefined;
      return { items, nextCursor };
    } catch {
      return json({ error: "Unauthorized or invalid payload" }, 400);
    }
  })
  .get("/customers/:id", async ({ request, params }) => {
    try {
      const session = await requireAuth(request);
      const orgId = await requireOrg(request, session.userId);
      const input = customerIdSchema.parse(params);
      const row = await db
        .select({
          id: schema.customer.id,
          name: schema.customer.name,
          email: schema.customer.email,
          phone: schema.customer.phone,
          notes: schema.customer.notes,
          createdAt: schema.customer.createdAt,
          updatedAt: schema.customer.updatedAt,
        })
        .from(schema.customer)
        .where(and(eq(schema.customer.id, input.id), eq(schema.customer.orgId, orgId)))
        .limit(1);

      if (!row[0]) return json({ error: "Customer not found" }, 404);
      return row[0];
    } catch {
      return json({ error: "Unauthorized or invalid payload" }, 400);
    }
  })
  .post("/customers", async ({ request, body }) => {
    try {
      const session = await requireAuth(request);
      const orgId = await requireOrg(request, session.userId);
      const input = createCustomerSchema.parse(body);

      const [created] = await db
        .insert(schema.customer)
        .values({
          orgId,
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          notes: input.notes ?? null,
        })
        .returning({
          id: schema.customer.id,
          name: schema.customer.name,
          email: schema.customer.email,
          phone: schema.customer.phone,
          notes: schema.customer.notes,
          createdAt: schema.customer.createdAt,
          updatedAt: schema.customer.updatedAt,
        });
      return created;
    } catch {
      return json({ error: "Unauthorized or invalid payload" }, 400);
    }
  })
  .patch("/customers/:id", async ({ request, params, body }) => {
    try {
      const session = await requireAuth(request);
      const orgId = await requireOrg(request, session.userId);
      const input = updateCustomerSchema.parse({ ...body, id: params.id });
      const [updated] = await db
        .update(schema.customer)
        .set({ name: input.name, email: input.email ?? null, phone: input.phone ?? null, notes: input.notes ?? null })
        .where(and(eq(schema.customer.id, input.id), eq(schema.customer.orgId, orgId)))
        .returning({
          id: schema.customer.id,
          name: schema.customer.name,
          email: schema.customer.email,
          phone: schema.customer.phone,
          notes: schema.customer.notes,
          createdAt: schema.customer.createdAt,
          updatedAt: schema.customer.updatedAt,
        });

      if (!updated) return json({ error: "Customer not found" }, 404);
      return updated;
    } catch {
      return json({ error: "Unauthorized or invalid payload" }, 400);
    }
  })
  .delete("/customers/:id", async ({ request, params }) => {
    try {
      const session = await requireAuth(request);
      const orgId = await requireOrg(request, session.userId);
      const input = customerIdSchema.parse(params);

      const existing = await db
        .select({ id: schema.customer.id })
        .from(schema.customer)
        .where(and(eq(schema.customer.id, input.id), eq(schema.customer.orgId, orgId)))
        .limit(1);
      if (!existing[0]) return json({ error: "Customer not found" }, 404);

      await db.delete(schema.customer).where(eq(schema.customer.id, input.id));
      return { ok: true };
    } catch {
      return json({ error: "Unauthorized or invalid payload" }, 400);
    }
  });

const port = Number(process.env.API_PORT ?? 4000);
app.listen(port);
console.log(`Orgaflow backend API running at http://localhost:${port}/api`);
