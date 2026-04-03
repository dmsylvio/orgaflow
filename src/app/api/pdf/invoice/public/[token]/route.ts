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
  organizationPreferences,
} from "@/server/db/schemas";
import { DocumentPdf } from "@/lib/pdf/document-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

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
        publicLinkCreatedAt: invoices.publicLinkCreatedAt,
        organizationId: invoices.organizationId,
        organizationName: organizations.name,
        customerName: customers.displayName,
        customerEmail: customers.email,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
        currencyPrecision: currencies.precision,
        currencyThousandSeparator: currencies.thousandSeparator,
        currencyDecimalSeparator: currencies.decimalSeparator,
        currencySwapSymbol: currencies.swapCurrencySymbol,
        publicLinksExpireEnabled: organizationPreferences.publicLinksExpireEnabled,
        publicLinksExpireDays: organizationPreferences.publicLinksExpireDays,
      })
      .from(invoices)
      .innerJoin(organizations, eq(invoices.organizationId, organizations.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .innerJoin(currencies, eq(invoices.currencyId, currencies.id))
      .leftJoin(
        organizationPreferences,
        eq(organizationPreferences.organizationId, invoices.organizationId),
      )
      .where(eq(invoices.publicLinkToken, token))
      .limit(1);

    if (!invoice?.publicLinkCreatedAt)
      return new Response("Not found", { status: 404 });

    const expireEnabled = invoice.publicLinksExpireEnabled ?? true;
    const expireDays = invoice.publicLinksExpireDays ?? 7;
    const expiresAt = expireEnabled
      ? new Date(
          invoice.publicLinkCreatedAt.getTime() +
            expireDays * 24 * 60 * 60 * 1000,
        )
      : null;

    if (expiresAt && expiresAt <= new Date())
      return new Response("Link expired", { status: 410 });

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
          eq(invoiceItems.organizationId, invoice.organizationId),
          eq(invoiceItems.invoiceId, invoice.id),
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
