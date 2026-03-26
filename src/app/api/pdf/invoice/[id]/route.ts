import { and, asc, eq } from "drizzle-orm";
import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { type ReactElement, createElement } from "react";
import { db } from "@/server/db";
import {
  currencies,
  customers,
  invoiceItems,
  invoices,
  organizations,
} from "@/server/db/schemas";
import { getCurrentAbility } from "@/server/services/iam/get-current-ability";
import { getOrganizationIdFromHeaders } from "@/server/trpc/context";
import { auth } from "../../../../../../auth";
import { DocumentPdf } from "@/lib/pdf/document-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
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

    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        notes: invoices.notes,
        subTotal: invoices.subTotal,
        total: invoices.total,
        tax: invoices.tax,
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
      .from(invoices)
      .innerJoin(organizations, eq(invoices.organizationId, organizations.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .innerJoin(currencies, eq(invoices.currencyId, currencies.id))
      .where(
        and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)),
      )
      .limit(1);

    if (!invoice) return new Response("Not found", { status: 404 });

    const lineItems = await db
      .select({
        id: invoiceItems.id,
        name: invoiceItems.name,
        description: invoiceItems.description,
        unitName: invoiceItems.unitName,
        quantity: invoiceItems.quantity,
        price: invoiceItems.price,
        total: invoiceItems.total,
      })
      .from(invoiceItems)
      .where(
        and(
          eq(invoiceItems.organizationId, organizationId),
          eq(invoiceItems.invoiceId, id),
        ),
      )
      .orderBy(asc(invoiceItems.createdAt));

    const currency = {
      id: "",
      code: invoice.currencyCode,
      symbol: invoice.currencySymbol,
      precision: invoice.currencyPrecision,
      thousandSeparator: invoice.currencyThousandSeparator,
      decimalSeparator: invoice.currencyDecimalSeparator,
      swapCurrencySymbol: invoice.currencySwapSymbol,
    };

    const element = createElement(DocumentPdf, {
      data: {
        type: "invoice",
        number: invoice.invoiceNumber,
        date: invoice.invoiceDate,
        secondaryDate: invoice.dueDate,
        secondaryDateLabel: "Due date",
        organizationName: invoice.organizationName,
        customer: {
          displayName: invoice.customerName,
          email: invoice.customerEmail,
        },
        currency,
        items: lineItems,
        subTotal: invoice.subTotal,
        tax: invoice.tax,
        total: invoice.total,
        notes: invoice.notes,
      },
    }) as unknown as ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(message, { status: 500 });
  }
}
