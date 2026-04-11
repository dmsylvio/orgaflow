import type { CurrencyFormat } from "@/lib/currency-format";

export interface PdfLineItem {
  id: string;
  name: string;
  description?: string | null;
  unitName?: string | null;
  quantity: string;
  price: string;
  total: string;
}

export interface PdfTemplateData {
  number: string;
  date: string;
  secondaryDate?: string | null;
  secondaryDateLabel?: string;
  organizationName: string;
  organizationAddress?: string | null;
  logoUrl?: string | null;
  customer: {
    displayName: string;
    email?: string | null;
    address?: string | null;
  };
  currency: CurrencyFormat;
  items: PdfLineItem[];
  subTotal: string;
  tax: string;
  total: string;
  notes?: string | null;
}
