import { and, asc, eq } from "drizzle-orm";
import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { type ReactElement, createElement } from "react";
import { formatOrgAddress, getPdfComponent } from "@/lib/pdf/get-pdf-component";
import { db } from "@/server/db";
import {
  currencies,
  customers,
  estimateItems,
  estimates,
  organizations,
  organizationPreferences,
} from "@/server/db/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const [estimate] = await db
      .select({
        id: estimates.id,
        estimateNumber: estimates.estimateNumber,
        estimateDate: estimates.estimateDate,
        expiryDate: estimates.expiryDate,
        notes: estimates.notes,
        subTotal: estimates.subTotal,
        total: estimates.total,
        tax: estimates.tax,
        publicLinkCreatedAt: estimates.publicLinkCreatedAt,
        organizationId: estimates.organizationId,
        organizationName: organizations.name,
        orgAddressLine1: organizations.addressLine1,
        orgAddressLine2: organizations.addressLine2,
        orgCity: organizations.city,
        orgRegion: organizations.region,
        orgPostalCode: organizations.postalCode,
        orgPhone: organizations.businessPhone,
        orgLogoUrl: organizations.logoUrl,
        customerName: customers.displayName,
        customerEmail: customers.email,
        customerAddress: customers.address,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
        currencyPrecision: currencies.precision,
        currencyThousandSeparator: currencies.thousandSeparator,
        currencyDecimalSeparator: currencies.decimalSeparator,
        currencySwapSymbol: currencies.swapCurrencySymbol,
        publicLinksExpireEnabled: organizationPreferences.publicLinksExpireEnabled,
        publicLinksExpireDays: organizationPreferences.publicLinksExpireDays,
        estimateTemplate: organizationPreferences.estimateTemplate,
      })
      .from(estimates)
      .innerJoin(organizations, eq(estimates.organizationId, organizations.id))
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .innerJoin(currencies, eq(estimates.currencyId, currencies.id))
      .leftJoin(
        organizationPreferences,
        eq(organizationPreferences.organizationId, estimates.organizationId),
      )
      .where(eq(estimates.publicLinkToken, token))
      .limit(1);

    if (!estimate?.publicLinkCreatedAt)
      return new Response("Not found", { status: 404 });

    const expireEnabled = estimate.publicLinksExpireEnabled ?? true;
    const expireDays = estimate.publicLinksExpireDays ?? 7;
    const expiresAt = expireEnabled
      ? new Date(
          estimate.publicLinkCreatedAt.getTime() +
            expireDays * 24 * 60 * 60 * 1000,
        )
      : null;

    if (expiresAt && expiresAt <= new Date())
      return new Response("Link expired", { status: 410 });

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
          eq(estimateItems.organizationId, estimate.organizationId),
          eq(estimateItems.estimateId, estimate.id),
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

    const templateId = (estimate.estimateTemplate ?? 1) as 1 | 2 | 3;
    const Component = getPdfComponent("estimate", templateId);

    const element = createElement(Component, {
      data: {
        number: estimate.estimateNumber,
        date: estimate.estimateDate,
        secondaryDate: estimate.expiryDate,
        secondaryDateLabel: "Expiry Date",
        organizationName: estimate.organizationName,
        organizationAddress: formatOrgAddress({
          addressLine1: estimate.orgAddressLine1,
          addressLine2: estimate.orgAddressLine2,
          city: estimate.orgCity,
          region: estimate.orgRegion,
          postalCode: estimate.orgPostalCode,
          businessPhone: estimate.orgPhone,
        }),
        logoUrl: estimate.orgLogoUrl,
        customer: {
          displayName: estimate.customerName,
          email: estimate.customerEmail,
          address: estimate.customerAddress,
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
