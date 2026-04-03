import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { and, asc, eq } from "drizzle-orm";
import { type ReactElement, createElement } from "react";
import { DocumentPdf } from "@/lib/pdf/document-pdf";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  currencies,
  customers,
  estimateItems,
  estimates,
  organizations,
} from "@/server/db/schemas";
import { getCurrentAbility } from "@/server/services/iam/get-current-ability";
import { getOrganizationIdFromHeaders } from "@/server/trpc/context";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getCurrentSession();
    const userId =
      session?.user && "id" in session.user
        ? (session.user as { id: string }).id
        : null;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const organizationId = getOrganizationIdFromHeaders(request.headers);
    if (!organizationId)
      return new Response("No active organization", { status: 400 });

    await getCurrentAbility({ db, userId, organizationId });

    const { id } = await params;

    const [estimate] = await db
      .select({
        id: estimates.id,
        estimateNumber: estimates.estimateNumber,
        status: estimates.status,
        estimateDate: estimates.estimateDate,
        expiryDate: estimates.expiryDate,
        notes: estimates.notes,
        subTotal: estimates.subTotal,
        total: estimates.total,
        tax: estimates.tax,
        organizationName: organizations.name,
        customerName: customers.displayName,
        customerEmail: customers.email,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
        currencyPrecision: currencies.precision,
        currencyThousandSeparator: currencies.thousandSeparator,
        currencyDecimalSeparator: currencies.decimalSeparator,
        currencySwapSymbol: currencies.swapCurrencySymbol,
      })
      .from(estimates)
      .innerJoin(organizations, eq(estimates.organizationId, organizations.id))
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .innerJoin(currencies, eq(estimates.currencyId, currencies.id))
      .where(
        and(eq(estimates.id, id), eq(estimates.organizationId, organizationId)),
      )
      .limit(1);

    if (!estimate) return new Response("Not found", { status: 404 });

    const lineItems = await db
      .select({
        id: estimateItems.id,
        name: estimateItems.name,
        description: estimateItems.description,
        unitName: estimateItems.unitName,
        quantity: estimateItems.quantity,
        price: estimateItems.price,
        total: estimateItems.total,
      })
      .from(estimateItems)
      .where(
        and(
          eq(estimateItems.organizationId, organizationId),
          eq(estimateItems.estimateId, id),
        ),
      )
      .orderBy(asc(estimateItems.createdAt));

    const currency = {
      id: "",
      code: estimate.currencyCode,
      symbol: estimate.currencySymbol,
      precision: estimate.currencyPrecision,
      thousandSeparator: estimate.currencyThousandSeparator,
      decimalSeparator: estimate.currencyDecimalSeparator,
      swapCurrencySymbol: estimate.currencySwapSymbol,
    };

    const element = createElement(DocumentPdf, {
      data: {
        type: "estimate",
        number: estimate.estimateNumber,
        date: estimate.estimateDate,
        secondaryDate: estimate.expiryDate,
        secondaryDateLabel: "Expiry",
        organizationName: estimate.organizationName,
        customer: {
          displayName: estimate.customerName,
          email: estimate.customerEmail,
        },
        currency,
        items: lineItems,
        subTotal: estimate.subTotal,
        tax: estimate.tax,
        total: estimate.total,
        notes: estimate.notes,
      },
    }) as unknown as ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${estimate.estimateNumber}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(message, { status: 500 });
  }
}
