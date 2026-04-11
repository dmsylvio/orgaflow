import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { organizations } from "@/server/db/schemas";
import { getCurrentAbility } from "@/server/services/iam/get-current-ability";
import { getOrganizationIdFromHeaders } from "@/server/trpc/context";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    return await handleLogoUpload(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/upload/logo]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    return await handleLogoDelete(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/upload/logo DELETE]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

async function getAuthContext(request: Request) {
  const session = await getCurrentSession();
  const userId =
    session?.user && "id" in session.user
      ? (session.user as { id: string }).id
      : null;

  if (!userId) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const organizationId = getOrganizationIdFromHeaders(request.headers);
  if (!organizationId) {
    return {
      error: Response.json({ error: "No active organization" }, { status: 400 }),
    };
  }

  const { membership } = await getCurrentAbility({ db, userId, organizationId });
  if (!membership) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId, organizationId };
}

async function handleLogoUpload(request: Request) {
  const auth = await getAuthContext(request);
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return Response.json(
      { error: "File type not allowed. Use PNG, JPG, WebP, GIF or SVG." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File too large. Maximum size is 5 MB." },
      { status: 400 },
    );
  }

  // Remove logo antigo se existir
  const [org] = await db
    .select({ logoUrl: organizations.logoUrl })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (org?.logoUrl) {
    await del(org.logoUrl).catch(() => null);
  }

  const blob = await put(
    `${organizationId}/logo/${Date.now()}-${file.name}`,
    file,
    { access: "public" },
  );

  await db
    .update(organizations)
    .set({ logoUrl: blob.url, updatedAt: new Date() })
    .where(eq(organizations.id, organizationId));

  return Response.json({ logoUrl: blob.url });
}

async function handleLogoDelete(request: Request) {
  const auth = await getAuthContext(request);
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const [org] = await db
    .select({ logoUrl: organizations.logoUrl })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (org?.logoUrl) {
    await del(org.logoUrl).catch(() => null);
  }

  await db
    .update(organizations)
    .set({ logoUrl: null, updatedAt: new Date() })
    .where(eq(organizations.id, organizationId));

  return Response.json({ ok: true });
}
