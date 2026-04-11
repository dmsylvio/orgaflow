import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatCurrencyDisplay } from "@/lib/currency-format";
import type { PdfTemplateData } from "@/lib/pdf/pdf-types";

// ---------------------------------------------------------------------------
// Helpers (private to this template)
// ---------------------------------------------------------------------------

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtQty(q: string): string {
  const s = q.trim();
  if (!s.includes(".")) return s;
  return s.replace(/0+$/, "").replace(/\.$/, "") || "0";
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

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const C = {
  primary: "#817AE3",
  total: "#5851D8",
  foreground: "#040405",
  muted: "#595959",
  label: "#55547A",
  border: "#E8E8E8",
  white: "#ffffff",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.foreground,
    paddingTop: 50,
    paddingBottom: 48,
    paddingHorizontal: 30,
    backgroundColor: C.white,
  },
  header: { alignItems: "center", marginBottom: 4 },
  logoImg: { height: 50, objectFit: "contain" },
  orgName: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    textTransform: "capitalize",
    marginTop: 20,
    paddingBottom: 4,
  },
  divider: { borderBottomWidth: 0.6, borderBottomColor: C.border, marginVertical: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 15, paddingBottom: 10 },
  companyAddr: { width: "35%", fontSize: 10, color: C.muted, lineHeight: 1.5 },
  docMeta: { alignItems: "flex-end" },
  metaRow: { flexDirection: "row", marginBottom: 3 },
  metaLabel: { fontSize: 10, color: C.label, width: 90, textAlign: "left", paddingRight: 40 },
  metaValue: { fontSize: 10, color: C.foreground, textAlign: "right" },
  billingSection: { paddingBottom: 12 },
  billLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  customerName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  customerDetail: { fontSize: 10, color: C.muted, lineHeight: 1.4 },
  tableWrap: { marginTop: 6 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: C.border,
    paddingBottom: 5,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.4,
    borderBottomColor: C.border,
  },
  tableRowLast: { flexDirection: "row", paddingVertical: 6 },
  colIdx: { width: 20, textAlign: "right" },
  colItem: { flex: 1, paddingLeft: 8 },
  colQty: { width: 52, textAlign: "right" },
  colPrice: { width: 68, textAlign: "right" },
  colTotal: { width: 68, textAlign: "right" },
  th: { fontSize: 10, color: C.label },
  tdIdx: { fontSize: 10, color: C.muted, textAlign: "right" },
  tdName: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  tdDesc: { fontSize: 8, color: C.muted, marginTop: 1 },
  tdNum: { fontSize: 10, color: C.muted },
  tdNumBold: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  hrLine: { borderTopWidth: 0.6, borderTopColor: C.border, marginTop: 8 },
  totalsWrap: { alignItems: "flex-end", marginTop: 4 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsLabel: { fontSize: 11, color: C.label, paddingLeft: 10 },
  totalsValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.foreground, paddingRight: 10 },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
  },
  totalFinalLabel: { fontSize: 11, color: C.label, padding: 8 },
  totalFinalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.total, padding: 8, textAlign: "right", minWidth: 100 },
  notesSection: { marginTop: 30 },
  notesLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6, color: C.foreground, letterSpacing: 0.5 },
  notesText: { fontSize: 10, color: C.muted, lineHeight: 1.6 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: C.muted },
  footerBrand: { fontSize: 8, color: C.primary },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EstimatePdf1({ data }: { data: PdfTemplateData }) {
  const notes = stripHtml(data.notes);

  return (
    <Document title={`Estimate ${data.number}`} author={data.organizationName}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          {data.logoUrl ? (
            <Image src={data.logoUrl} style={s.logoImg} />
          ) : (
            <Text style={s.orgName}>{data.organizationName}</Text>
          )}
        </View>
        <View style={s.divider} />

        {/* Info row */}
        <View style={s.infoRow}>
          {data.organizationAddress ? (
            <Text style={s.companyAddr}>{data.organizationAddress}</Text>
          ) : (
            <View style={{ width: "35%" }} />
          )}
          <View style={s.docMeta}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Estimate No.</Text>
              <Text style={s.metaValue}>{data.number}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Estimate Date</Text>
              <Text style={s.metaValue}>{fmtDate(data.date)}</Text>
            </View>
            {data.secondaryDate ? (
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>{data.secondaryDateLabel ?? "Expiry Date"}</Text>
                <Text style={s.metaValue}>{fmtDate(data.secondaryDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Billing */}
        <View style={s.billingSection}>
          <Text style={s.billLabel}>Bill To</Text>
          <Text style={s.customerName}>{data.customer.displayName}</Text>
          {data.customer.email ? (
            <Text style={s.customerDetail}>{data.customer.email}</Text>
          ) : null}
          {data.customer.address ? (
            <Text style={s.customerDetail}>{data.customer.address}</Text>
          ) : null}
        </View>

        {/* Items table */}
        <View style={s.tableWrap}>
          <View style={s.tableHead}>
            <View style={s.colIdx}><Text style={s.th}>#</Text></View>
            <View style={s.colItem}><Text style={{ ...s.th, paddingLeft: 8 }}>Item</Text></View>
            <View style={s.colQty}><Text style={s.th}>Qty</Text></View>
            <View style={s.colPrice}><Text style={s.th}>Price</Text></View>
            <View style={s.colTotal}><Text style={s.th}>Amount</Text></View>
          </View>

          {data.items.map((item, idx) => {
            const isLast = idx === data.items.length - 1;
            return (
              <View key={item.id} style={isLast ? s.tableRowLast : s.tableRow}>
                <View style={s.colIdx}>
                  <Text style={s.tdIdx}>{idx + 1}</Text>
                </View>
                <View style={s.colItem}>
                  <Text style={s.tdName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={s.tdDesc}>{item.description}</Text>
                  ) : null}
                </View>
                <View style={s.colQty}>
                  <Text style={s.tdNum}>
                    {fmtQty(item.quantity)}{item.unitName ? ` ${item.unitName}` : ""}
                  </Text>
                </View>
                <View style={s.colPrice}>
                  <Text style={s.tdNum}>{formatCurrencyDisplay(item.price, data.currency)}</Text>
                </View>
                <View style={s.colTotal}>
                  <Text style={s.tdNumBold}>{formatCurrencyDisplay(item.total, data.currency)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.hrLine} />

        {/* Totals */}
        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{formatCurrencyDisplay(data.subTotal, data.currency)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Tax</Text>
              <Text style={s.totalsValue}>{formatCurrencyDisplay(data.tax, data.currency)}</Text>
            </View>
            <View style={{ height: 4 }} />
            <View style={s.totalFinalRow}>
              <Text style={s.totalFinalLabel}>Total</Text>
              <Text style={s.totalFinalValue}>{formatCurrencyDisplay(data.total, data.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {notes ? (
          <View style={s.notesSection}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{data.organizationName} · Estimate {data.number}</Text>
          <Text style={s.footerBrand}>Powered by Orgaflow</Text>
        </View>

      </Page>
    </Document>
  );
}
