import type { ReactElement } from "react";
import type { PdfTemplateData } from "@/lib/pdf/pdf-types";
import { EstimatePdf1 } from "@/lib/pdf/templates/estimate-1";
import { EstimatePdf2 } from "@/lib/pdf/templates/estimate-2";
import { EstimatePdf3 } from "@/lib/pdf/templates/estimate-3";
import { InvoicePdf1 } from "@/lib/pdf/templates/invoice-1";
import { InvoicePdf2 } from "@/lib/pdf/templates/invoice-2";
import { InvoicePdf3 } from "@/lib/pdf/templates/invoice-3";

export type PdfTemplateId = 1 | 2 | 3;

type PdfComponent = (props: { data: PdfTemplateData }) => ReactElement;

export function getPdfComponent(
  type: "invoice" | "estimate",
  templateId: PdfTemplateId,
): PdfComponent {
  if (type === "invoice") {
    if (templateId === 2) return InvoicePdf2 as unknown as PdfComponent;
    if (templateId === 3) return InvoicePdf3 as unknown as PdfComponent;
    return InvoicePdf1 as unknown as PdfComponent;
  }

  if (templateId === 2) return EstimatePdf2 as unknown as PdfComponent;
  if (templateId === 3) return EstimatePdf3 as unknown as PdfComponent;
  return EstimatePdf1 as unknown as PdfComponent;
}

/**
 * Formats the organization address fields into a single multi-line string
 * suitable for display inside a PDF template.
 */
export function formatOrgAddress(org: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  businessPhone?: string | null;
}): string | null {
  const parts: string[] = [];

  if (org.addressLine1) parts.push(org.addressLine1);
  if (org.addressLine2) parts.push(org.addressLine2);

  const cityLine = [org.city, org.region, org.postalCode].filter(Boolean).join(", ");
  if (cityLine) parts.push(cityLine);

  if (org.businessPhone) parts.push(org.businessPhone);

  return parts.length > 0 ? parts.join("\n") : null;
}
