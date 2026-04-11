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
// Design tokens — Branded Purple Header
// ---------------------------------------------------------------------------

const C = {
  accent: "#817AE3",
  total: "#5851D8",
  foreground: "#040405",
  muted: "#595959",
  label: "#55547A",
  border: "#E8E8E8",
  white: "#ffffff",
  headerText: "rgba(255,255,255,0.85)",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.foreground,
    paddingTop: 0,
    paddingBottom: 48,
    paddingHorizontal: 0,
    backgroundColor: C.white,
  },
  headerBand: {
    backgroundColor: C.accent,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  headerLeft: { width: "60%" },
  logoImg: { height: 50, objectFit: "contain" },
  orgNameHeader: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textTransform: "capitalize",
  },
  headerRight: { width: "40%", alignItems: "flex-end" },
  docTypeText: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.white, marginBottom: 4 },
  docNumberText: { fontSize: 10, color: C.headerText },
  docDateText: { fontSize: 10, color: C.headerText, marginTop: 2 },
  body: { paddingHorizontal: 30 },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 16,
  },
  companyBlock: { width: "40%" },
  companyLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  companyText: { fontSize: 10, color: C.muted, lineHeight: 1.5 },
  billBlock: { width: "45%", alignItems: "flex-end" },
  billLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  billName: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right", marginBottom: 2 },
  billDetail: { fontSize: 10, color: C.muted, textAlign: "right", lineHeight: 1.4 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: C.border,
    paddingBottom: 5,
    marginTop: 8,
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
  notesSection: { marginTop: 20 },
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
  footerBrand: { fontSize: 8, color: C.accent },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EstimatePdf2({ data }: { data: PdfTemplateData }) {
  const notes = stripHtml(data.notes);

  return (
    <Document title={`Estimate ${data.number}`} author={data.organizationName}>
      <Page size="A4" style={s.page}>

        {/* Purple header band */}
        <View style={s.headerBand}>
          <View style={s.headerLeft}>
            {data.logoUrl ? (
              <Image src={data.logoUrl} style={s.logoImg} />
            ) : (
              <Text style={s.orgNameHeader}>{data.organizationName}</Text>
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.docTypeText}>ESTIMATE</Text>
            <Text style={s.docNumberText}>{data.number}</Text>
            <Text style={s.docDateText}>{fmtDate(data.date)}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* Addresses row */}
          <View style={s.addressRow}>
            <View style={s.companyBlock}>
              {data.organizationAddress ? (
                <>
                  <Text style={s.companyLabel}>From</Text>
                  <Text style={s.companyText}>{data.organizationAddress}</Text>
                </>
              ) : null}
            </View>
            <View style={s.billBlock}>
              <Text style={s.billLabel}>Bill To</Text>
              <Text style={s.billName}>{data.customer.displayName}</Text>
              {data.customer.email ? (
                <Text style={s.billDetail}>{data.customer.email}</Text>
              ) : null}
              {data.customer.address ? (
                <Text style={s.billDetail}>{data.customer.address}</Text>
              ) : null}
            </View>
          </View>

          {/* Expiry date row */}
          {data.secondaryDate ? (
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: C.label, marginRight: 8 }}>
                {data.secondaryDateLabel ?? "Expiry Date"}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>
                {fmtDate(data.secondaryDate)}
              </Text>
            </View>
          ) : null}

          {/* Items table */}
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

        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{data.organizationName} · Estimate {data.number}</Text>
          <Text style={s.footerBrand}>Powered by Orgaflow</Text>
        </View>

      </Page>
    </Document>
  );
}
