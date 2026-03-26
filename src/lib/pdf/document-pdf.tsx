import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CurrencyFormat } from "@/lib/currency-format";
import { formatCurrencyDisplay } from "@/lib/currency-format";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatQty(quantity: string): string {
  const s = quantity.trim();
  if (!s.includes(".")) return s;
  return s.replace(/0+$/, "").replace(/\.$/, "") || "0";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PdfLineItem {
  id: string;
  name: string;
  description?: string | null;
  unitName?: string | null;
  quantity: string;
  price: string;
  total: string;
}

export interface PdfDocumentData {
  type: "estimate" | "invoice";
  number: string;
  date: string;
  secondaryDate?: string | null; // expiryDate for estimate / dueDate for invoice
  secondaryDateLabel?: string;
  organizationName: string;
  customer: { displayName: string; email?: string | null };
  currency: CurrencyFormat;
  items: PdfLineItem[];
  subTotal: string;
  tax: string;
  total: string;
  notes?: string | null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const C = {
  primary: "#2563eb",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.foreground,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    backgroundColor: C.white,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  orgName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.foreground,
  },
  docMeta: { alignItems: "flex-end" },
  docType: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    marginBottom: 3,
  },
  docNumber: { fontSize: 10, color: C.muted },

  // Info row
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  infoBox: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 10,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: { fontSize: 9, color: C.foreground, fontFamily: "Helvetica-Bold" },
  infoSub: { fontSize: 8, color: C.muted, marginTop: 1 },
  totalBox: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 6,
    padding: 10,
  },
  totalLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 6,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 7,
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 7,
  },
  colItem: { flex: 1 },
  colQty: { width: 48, textAlign: "right" },
  colPrice: { width: 72, textAlign: "right" },
  colTotal: { width: 72, textAlign: "right" },
  thText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.foreground },
  tdDesc: { fontSize: 8, color: C.muted, marginTop: 1 },
  tdNum: { fontSize: 9, color: C.muted },
  tdNumBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.foreground },

  // Totals
  totalsSection: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalsBox: { width: 200 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: { fontSize: 9, color: C.muted },
  totalsValue: { fontSize: 9, color: C.foreground },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginVertical: 4,
  },
  totalsFinalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.foreground },
  totalsFinalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary },

  // Notes
  notesSection: { marginTop: 24 },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  notesText: { fontSize: 9, color: C.foreground, lineHeight: 1.6 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: C.muted },
  footerBrand: { fontSize: 7, color: C.primary },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentPdf({ data }: { data: PdfDocumentData }) {
  const label = data.type === "estimate" ? "Estimate" : "Invoice";
  const notes = stripHtml(data.notes);

  return (
    <Document
      title={`${label} ${data.number}`}
      author={data.organizationName}
    >
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.orgName}>{data.organizationName}</Text>
          <View style={styles.docMeta}>
            <Text style={styles.docType}>{label}</Text>
            <Text style={styles.docNumber}>{data.number}</Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Bill to</Text>
            <Text style={styles.infoValue}>{data.customer.displayName}</Text>
            {data.customer.email ? (
              <Text style={styles.infoSub}>{data.customer.email}</Text>
            ) : null}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(data.date)}</Text>
          </View>
          {data.secondaryDate ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>
                {data.secondaryDateLabel ?? "Expiry"}
              </Text>
              <Text style={styles.infoValue}>
                {formatDate(data.secondaryDate)}
              </Text>
            </View>
          ) : null}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrencyDisplay(data.total, data.currency)}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <View style={styles.colItem}>
            <Text style={styles.thText}>Item</Text>
          </View>
          <View style={styles.colQty}>
            <Text style={styles.thText}>Qty</Text>
          </View>
          <View style={styles.colPrice}>
            <Text style={styles.thText}>Unit price</Text>
          </View>
          <View style={styles.colTotal}>
            <Text style={styles.thText}>Total</Text>
          </View>
        </View>

        {data.items.map((item, idx) => {
          const isLast = idx === data.items.length - 1;
          return (
            <View
              key={item.id}
              style={isLast ? styles.tableRowLast : styles.tableRow}
            >
              <View style={styles.colItem}>
                <Text style={styles.tdName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.tdDesc}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tdNum}>
                  {formatQty(item.quantity)}
                  {item.unitName ? ` ${item.unitName}` : ""}
                </Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.tdNum}>
                  {formatCurrencyDisplay(item.price, data.currency)}
                </Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.tdNumBold}>
                  {formatCurrencyDisplay(item.total, data.currency)}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrencyDisplay(data.subTotal, data.currency)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>
                {formatCurrencyDisplay(data.tax, data.currency)}
              </Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsRow}>
              <Text style={styles.totalsFinalLabel}>Total</Text>
              <Text style={styles.totalsFinalValue}>
                {formatCurrencyDisplay(data.total, data.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.organizationName} · {label} {data.number}
          </Text>
          <Text style={styles.footerBrand}>Powered by Orgaflow</Text>
        </View>
      </Page>
    </Document>
  );
}
