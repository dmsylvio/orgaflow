"use client";

/**
 * Read-only view shared by the estimate and invoice detail pages.
 * Mirrors the editor layout: the document on the left, a sticky summary
 * with actions on the right.
 */

import { CalendarDays, Mail, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { RichTextContent } from "@/components/ui/rich-text-editor";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";

export type DocumentViewItem = {
  id: string;
  name: string;
  description?: string | null;
  quantity: string;
  unitName?: string | null;
  price?: string | null;
  total?: string | null;
};

function trimDecimal(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : value;
}

function MetaItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="truncate text-sm font-medium text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DocumentView({
  kindLabel,
  number,
  status,
  customer,
  dates,
  items,
  currency,
  canViewPrices,
  totals,
  notes,
  summary,
  attachments,
}: {
  kindLabel: string;
  number: string;
  status: ReactNode;
  customer: { name: string; email?: string | null };
  /** e.g. [["Invoice date", "Apr 19, 2026"], ["Due date", "May 21, 2026"]] */
  dates: [string, string][];
  items: DocumentViewItem[];
  currency: CurrencyFormat;
  canViewPrices: boolean;
  totals: { subTotal: string | null; tax: string | null; total: string | null };
  notes?: string | null;
  /** Sticky right column: totals + actions. */
  summary: ReactNode;
  attachments?: ReactNode;
}) {
  const money = (value: string | number | null | undefined) =>
    formatCurrencyDisplay(value ?? "", currency);

  const sub = Number(totals.subTotal ?? 0);
  const tax = Number(totals.tax ?? 0);
  const total = Number(totals.total ?? 0);
  // Discount is applied before tax: total = (subtotal - discount) + tax.
  const discount = sub + tax - total;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="min-w-0 space-y-6">
        <article className="app-card overflow-hidden">
          {/* Header */}
          <header className="hidden flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-5 sm:flex sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {kindLabel}
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {number}
              </h2>
            </div>
            {status}
          </header>

          {/* Meta */}
          <div className="grid gap-4 border-b border-border px-5 py-5 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
            <MetaItem icon={UserRound} label="Customer">
              {customer.name}
            </MetaItem>
            <MetaItem icon={Mail} label="Email">
              {customer.email || "—"}
            </MetaItem>
            {dates.map(([label, value]) => (
              <MetaItem key={label} icon={CalendarDays} label={label}>
                {value}
              </MetaItem>
            ))}
          </div>

          {/* Items */}
          <div className="px-5 py-4 sm:px-6">
            <div className="hidden grid-cols-[minmax(0,1fr)_80px_130px_120px] gap-4 border-b border-border pb-2 md:grid">
              <span className="app-th">Item</span>
              <span className="app-th text-right">Qty</span>
              {canViewPrices ? (
                <>
                  <span className="app-th text-right">Unit price</span>
                  <span className="app-th text-right">Amount</span>
                </>
              ) : null}
            </div>

            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No items yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="grid gap-1 py-3.5 md:grid-cols-[minmax(0,1fr)_80px_130px_120px] md:items-start md:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      {item.description ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    {/* Mobile: one compact line */}
                    <div className="flex items-baseline justify-between gap-3 text-sm md:contents">
                      <p className="text-muted-foreground md:text-right md:text-foreground">
                        {trimDecimal(item.quantity)}
                        {item.unitName ? (
                          <span className="text-muted-foreground">
                            {" "}
                            {item.unitName}
                          </span>
                        ) : null}
                        {canViewPrices ? (
                          <span className="md:hidden">
                            {" "}
                            × {money(item.price)}
                          </span>
                        ) : null}
                      </p>
                      {canViewPrices ? (
                        <>
                          <p className="hidden text-right tabular-nums text-foreground md:block">
                            {money(item.price)}
                          </p>
                          <p className="text-right font-semibold tabular-nums text-foreground">
                            {money(item.total)}
                          </p>
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Totals */}
          {canViewPrices ? (
            <div className="border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
              <dl className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums text-foreground">
                    {money(totals.subTotal)}
                  </dd>
                </div>
                {discount > 0.004 ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Discount</dt>
                    <dd className="tabular-nums text-foreground">
                      −{money(discount.toFixed(3))}
                    </dd>
                  </div>
                ) : null}
                {tax > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tax</dt>
                    <dd className="tabular-nums text-foreground">
                      {money(totals.tax)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between border-t border-border pt-2">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="text-lg font-bold tabular-nums text-foreground">
                    {money(totals.total)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </article>

        {notes ? (
          <section className="app-card">
            <header className="border-b border-border px-5 py-3.5">
              <h2 className="text-[15px] font-semibold text-foreground">
                Notes
              </h2>
            </header>
            <RichTextContent
              html={notes}
              className="px-5 py-4 text-sm text-muted-foreground"
            />
          </section>
        ) : null}

        {attachments}
      </div>

      {/* Summary + actions come first on phones, sticky on the right on desktop. */}
      <aside className="order-first space-y-4 lg:sticky lg:top-6 lg:order-none">
        {summary}
      </aside>
    </div>
  );
}

/** Right-column card: big total, key facts, and action buttons. */
export function DocumentSummaryCard({
  totalLabel = "Total",
  total,
  facts,
  actions,
}: {
  totalLabel?: string;
  total?: string | null;
  facts?: [string, ReactNode][];
  actions: ReactNode;
}) {
  return (
    <section className="app-card">
      {total ? (
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">{totalLabel}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {total}
          </p>
        </div>
      ) : null}
      {facts && facts.length > 0 ? (
        <dl className="space-y-2 border-b border-border px-5 py-4 text-sm">
          {facts.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="flex flex-col gap-2 px-5 py-4">{actions}</div>
    </section>
  );
}
