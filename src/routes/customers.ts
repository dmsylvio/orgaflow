import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import type { Elysia } from "elysia";
import { db, schema } from "../db";
import { badRequest, notFound } from "../lib/http";
import { requireAuth, requireOrg } from "../modules/context";
import {
  createCustomerSchema,
  customerIdSchema,
  listCustomersSchema,
  updateCustomerSchema,
} from "../validation";

const customerFields = {
  id: schema.customer.id,
  name: schema.customer.name,
  email: schema.customer.email,
  phone: schema.customer.phone,
  notes: schema.customer.notes,
  createdAt: schema.customer.createdAt,
  updatedAt: schema.customer.updatedAt,
} as const;

function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString(
    "base64url",
  );
}

function decodeCursor(cursor?: string) {
  if (!cursor) return null;

  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const [date, id] = raw.split("|");
    if (!date || !id) return null;

    const createdAt = new Date(date);
    if (Number.isNaN(createdAt.getTime())) return null;

    return { createdAt, id };
  } catch {
    return null;
  }
}

export function registerCustomerRoutes(app: Elysia) {
  return app
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

        const cursor = decodeCursor(input.cursor);
        if (input.cursor && !cursor) return badRequest("Invalid cursor");

        const cursorWhere = cursor
          ? and(
              where,
              or(
                lt(schema.customer.createdAt, cursor.createdAt),
                and(
                  eq(schema.customer.createdAt, cursor.createdAt),
                  lt(schema.customer.id, cursor.id),
                ),
              ),
            )
          : where;

        const rows = await db
          .select(customerFields)
          .from(schema.customer)
          .where(cursorWhere)
          .orderBy(desc(schema.customer.createdAt))
          .limit(input.limit + 1);

        const items = rows.slice(0, input.limit);
        const nextCursor =
          rows.length > input.limit && rows[input.limit]
            ? encodeCursor(rows[input.limit].createdAt, rows[input.limit].id)
            : undefined;

        return { items, nextCursor };
      } catch {
        return badRequest("Unauthorized or invalid payload");
      }
    })
    .get("/customers/:id", async ({ request, params }) => {
      try {
        const session = await requireAuth(request);
        const orgId = await requireOrg(request, session.userId);
        const input = customerIdSchema.parse(params);

        const row = await db
          .select(customerFields)
          .from(schema.customer)
          .where(
            and(
              eq(schema.customer.id, input.id),
              eq(schema.customer.orgId, orgId),
            ),
          )
          .limit(1);

        if (!row[0]) return notFound("Customer not found");
        return row[0];
      } catch {
        return badRequest("Unauthorized or invalid payload");
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
          .returning(customerFields);

        return created;
      } catch {
        return badRequest("Unauthorized or invalid payload");
      }
    })
    .patch("/customers/:id", async ({ request, params, body }) => {
      try {
        const session = await requireAuth(request);
        const orgId = await requireOrg(request, session.userId);
        const input = updateCustomerSchema.parse({
          ...(typeof body === "object" && body ? body : {}),
          id: params.id,
        });

        const [updated] = await db
          .update(schema.customer)
          .set({
            name: input.name,
            email: input.email ?? null,
            phone: input.phone ?? null,
            notes: input.notes ?? null,
          })
          .where(
            and(
              eq(schema.customer.id, input.id),
              eq(schema.customer.orgId, orgId),
            ),
          )
          .returning(customerFields);

        if (!updated) return notFound("Customer not found");
        return updated;
      } catch {
        return badRequest("Unauthorized or invalid payload");
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
          .where(
            and(
              eq(schema.customer.id, input.id),
              eq(schema.customer.orgId, orgId),
            ),
          )
          .limit(1);

        if (!existing[0]) return notFound("Customer not found");

        await db
          .delete(schema.customer)
          .where(eq(schema.customer.id, input.id));

        return { ok: true };
      } catch {
        return badRequest("Unauthorized or invalid payload");
      }
    });
}
