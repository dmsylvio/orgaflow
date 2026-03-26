import "server-only";

import { and, eq } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import {
  organizationMembers,
  organizationNotificationSettings,
  users,
} from "@/server/db/schemas";
import { sendTransactionalEmail } from "@/server/services/email/resend";

interface SendViewedNotificationParams {
  db: DbClient;
  organizationId: string;
  documentType: "estimate" | "invoice";
  documentNumber: string;
  customerName: string;
  documentUrl: string;
}

export async function sendViewedNotification({
  db,
  organizationId,
  documentType,
  documentNumber,
  customerName,
  documentUrl,
}: SendViewedNotificationParams): Promise<void> {
  const [settings] = await db
    .select()
    .from(organizationNotificationSettings)
    .where(eq(organizationNotificationSettings.organizationId, organizationId))
    .limit(1);

  const enabled =
    documentType === "estimate"
      ? (settings?.estimateViewed ?? false)
      : (settings?.invoiceViewed ?? false);

  if (!enabled) return;

  // Determine destination: custom email or owner's email
  let toEmail = settings?.notifyEmail?.trim() || null;

  if (!toEmail) {
    const [owner] = await db
      .select({ email: users.email })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.isOwner, true),
        ),
      )
      .limit(1);

    toEmail = owner?.email ?? null;
  }

  if (!toEmail) return;

  const label = documentType === "estimate" ? "Estimate" : "Invoice";
  const subject = `${label} ${documentNumber} was viewed by ${customerName}`;

  const html = `
    <p>Hi,</p>
    <p><strong>${customerName}</strong> just viewed ${label.toLowerCase()} <strong>${documentNumber}</strong>.</p>
    <p><a href="${documentUrl}">View ${label}</a></p>
    <hr />
    <p style="color:#888;font-size:12px;">You're receiving this because you have "${label} viewed" notifications enabled in your Orgaflow settings.</p>
  `;

  const text = `${customerName} viewed ${label} ${documentNumber}.\n\nView it here: ${documentUrl}`;

  try {
    await sendTransactionalEmail({ to: toEmail, subject, html, text });
  } catch {
    // Notification failures should not break the public page
  }
}
