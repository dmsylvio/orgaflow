import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { documentFiles } from "@/server/db/schemas";
import { getCurrentAbility } from "@/server/services/iam/get-current-ability";
import { getOrganizationIdFromHeaders } from "@/server/trpc/context";
import { auth } from "../../../../auth";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const VALID_RESOURCE_TYPES = new Set(["expense", "estimate", "invoice"]);

export async function POST(request: Request) {
  try {
    return await handleUpload(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/upload]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

async function handleUpload(request: Request) {
  const session = await auth();
  const userId =
    session?.user && "id" in session.user
      ? (session.user as { id: string }).id
      : null;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = getOrganizationIdFromHeaders(request.headers);
  if (!organizationId) {
    return Response.json({ error: "No active organization" }, { status: 400 });
  }

  const { membership } = await getCurrentAbility({
    db,
    userId,
    organizationId,
  });

  if (!membership) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const resourceType = formData.get("resourceType");
  const resourceId = formData.get("resourceId");

  if (!(file instanceof File) || !resourceType || !resourceId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (
    typeof resourceType !== "string" ||
    !VALID_RESOURCE_TYPES.has(resourceType)
  ) {
    return Response.json({ error: "Invalid resource type" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return Response.json(
      {
        error:
          "File type not allowed. Supported: PDF, PNG, JPG, GIF, SVG, WEBP, DOCX, ZIP",
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File too large. Maximum size is 25 MB" },
      { status: 400 },
    );
  }

  // Verify resource belongs to this organization
  if (resourceType === "expense") {
    const { expenses } = await import("@/server/db/schemas");
    const [row] = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(
        and(
          eq(expenses.id, resourceId as string),
          eq(expenses.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!row) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }
  }

  const blob = await put(
    `${organizationId}/${resourceType}/${resourceId as string}/${Date.now()}-${file.name}`,
    file,
    { access: "public" },
  );

  const [inserted] = await db
    .insert(documentFiles)
    .values({
      organizationId,
      resourceType: resourceType as "expense" | "estimate" | "invoice",
      resourceId: resourceId as string,
      fileName: file.name,
      storageKey: blob.url,
      mimeType: file.type,
      fileSize: file.size,
      isPublic: false,
      uploadedById: userId,
    })
    .returning({
      id: documentFiles.id,
      fileName: documentFiles.fileName,
      storageKey: documentFiles.storageKey,
      fileSize: documentFiles.fileSize,
      mimeType: documentFiles.mimeType,
    });

  return Response.json(inserted);
}

