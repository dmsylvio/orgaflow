"use client";

/**
 * Shared building blocks for the estimate and invoice create/edit screens.
 * Purely presentational: each form keeps its own state, totals and mutations.
 */

import {
  DollarSign,
  FileText,
  ImageIcon,
  Percent,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { ItemPicker } from "@/components/ui/item-picker";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** Two columns on desktop (content + sticky summary); stacked on mobile. */
export function DocumentEditorLayout({
  children,
  summary,
  mobileBar,
}: {
  children: ReactNode;
  summary: ReactNode;
  /** Sticky bottom bar on small screens (total + primary action). */
  mobileBar?: ReactNode;
}) {
  return (
    <>
      <div className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:pb-0">
        <div className="min-w-0 space-y-6">{children}</div>
        <aside className="space-y-4 lg:sticky lg:top-6">{summary}</aside>
      </div>
      {mobileBar ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur lg:hidden">
          {mobileBar}
        </div>
      ) : null}
    </>
  );
}

export function EditorSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("app-card", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Customer picker on one side, date/number fields on the other. */
export function DocumentDetailsGrid({
  customer,
  children,
}: {
  customer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="min-w-0">{customer}</div>
      <div className="grid content-start gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function EditorField({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Line items                                                          */
/* ------------------------------------------------------------------ */

export type EditorLineItem = {
  id: string;
  itemId: string;
  quantity: string;
  unitPrice: string;
};

export type CatalogItemInfo = {
  description?: string | null;
  unitName?: string | null;
};

export function LineItemsEditor({
  idPrefix,
  items,
  currency,
  catalog,
  onCatalogItemChange,
  onQuantityChange,
  onPriceChange,
  onAdd,
  onRemove,
}: {
  idPrefix: string;
  items: EditorLineItem[];
  currency: CurrencyFormat;
  catalog: Map<string, CatalogItemInfo>;
  onCatalogItemChange: (lineId: string, itemId: string) => void;
  onQuantityChange: (lineId: string, value: string) => void;
  onPriceChange: (lineId: string, value: string) => void;
  onAdd: () => void;
  onRemove: (lineId: string) => void;
}) {
  return (
    <div>
      {/* Column headers (desktop) */}
      <div className="hidden grid-cols-[minmax(0,1fr)_88px_150px_110px_36px] gap-3 px-1 pb-2 md:grid">
        <span className="app-th">Item</span>
        <span className="app-th">Qty</span>
        <span className="app-th">Unit price</span>
        <span className="app-th text-right">Amount</span>
        <span className="sr-only">Remove</span>
      </div>

      <ol className="space-y-3 md:space-y-2">
        {items.map((line, index) => {
          const info = line.itemId ? catalog.get(line.itemId) : undefined;
          const amount =
            Number(line.quantity || 0) * Number(line.unitPrice || 0);
          const amountLabel = formatCurrencyDisplay(
            Number.isFinite(amount) ? amount.toFixed(3) : "0",
            currency,
          );

          return (
            <li
              key={line.id}
              className="rounded-xl border border-border bg-muted/30 p-3 md:rounded-lg md:border-transparent md:bg-transparent md:p-1 md:hover:bg-muted/40"
            >
              <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_88px_150px_110px_36px] md:items-start">
                <div className="col-span-2 min-w-0 md:col-span-1">
                  <Label
                    htmlFor={`${idPrefix}-item-${line.id}`}
                    className="mb-1.5 block text-xs text-muted-foreground md:sr-only"
                  >
                    Item {index + 1}
                  </Label>
                  <ItemPicker
                    id={`${idPrefix}-item-${line.id}`}
                    value={line.itemId}
                    onValueChange={(itemId) =>
                      onCatalogItemChange(line.id, itemId)
                    }
                  />
                  {info?.description ? (
                    <p className="mt-1 line-clamp-2 px-1 text-xs text-muted-foreground">
                      {info.description}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label
                    htmlFor={`${idPrefix}-qty-${line.id}`}
                    className="mb-1.5 block text-xs text-muted-foreground md:sr-only"
                  >
                    Qty
                  </Label>
                  <Input
                    id={`${idPrefix}-qty-${line.id}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={line.quantity}
                    onChange={(event) =>
                      onQuantityChange(line.id, event.target.value)
                    }
                  />
                  {info?.unitName ? (
                    <p className="mt-1 px-1 text-xs text-muted-foreground">
                      {info.unitName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label
                    htmlFor={`${idPrefix}-price-${line.id}`}
                    className="mb-1.5 block text-xs text-muted-foreground md:sr-only"
                  >
                    Unit price
                  </Label>
                  <CurrencyInput
                    id={`${idPrefix}-price-${line.id}`}
                    currency={currency}
                    value={line.unitPrice}
                    onValueChange={(value) => onPriceChange(line.id, value)}
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between border-t border-border pt-3 md:col-span-1 md:block md:border-0 md:pt-0">
                  <span className="text-xs text-muted-foreground md:hidden">
                    Amount
                  </span>
                  <p className="text-sm font-semibold tabular-nums text-foreground md:flex md:h-10 md:items-center md:justify-end">
                    {amountLabel}
                  </p>
                </div>

                <div className="hidden md:block">
                  <button
                    type="button"
                    onClick={() => onRemove(line.id)}
                    aria-label={`Remove item ${index + 1}`}
                    className="flex h-10 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Remove (mobile) */}
              <button
                type="button"
                onClick={() => onRemove(line.id)}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive md:hidden"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove item
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        Add item
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

export type SummaryTaxRow = {
  key: string;
  taxId: string;
  amount: number;
};

export type TaxTypeOption = { id: string; name: string; percent: string };

export function DocumentSummary({
  currency,
  subTotal,
  discountValue,
  discountType,
  onDiscountValueChange,
  onDiscountTypeChange,
  taxRows,
  taxTypes,
  onAddTax,
  onTaxChange,
  onRemoveTax,
  grandTotal,
  footer,
}: {
  currency: CurrencyFormat;
  subTotal: number;
  discountValue: string;
  discountType: "fixed" | "percentage";
  onDiscountValueChange: (value: string) => void;
  onDiscountTypeChange: (type: "fixed" | "percentage") => void;
  taxRows: SummaryTaxRow[];
  taxTypes: TaxTypeOption[];
  onAddTax: () => void;
  onTaxChange: (key: string, taxId: string) => void;
  onRemoveTax: (key: string) => void;
  grandTotal: number;
  /** Action buttons, shown under the total on desktop. */
  footer?: ReactNode;
}) {
  const money = (value: number) =>
    formatCurrencyDisplay(value.toFixed(3), currency);

  return (
    <section className="app-card">
      <header className="border-b border-border px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-foreground">Summary</h2>
      </header>
      <div className="space-y-4 px-5 py-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums text-foreground">
            {money(subTotal)}
          </span>
        </div>

        <div className="space-y-1.5">
          <span className="text-muted-foreground">Discount</span>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => onDiscountValueChange(e.target.value)}
              placeholder="0"
              aria-label="Discount"
              className="flex-1"
            />
            <fieldset className="m-0 flex shrink-0 rounded-lg border border-input bg-muted/50 p-0.5">
              <legend className="sr-only">Discount type</legend>
              {(
                [
                  ["fixed", DollarSign, "Fixed amount"],
                  ["percentage", Percent, "Percentage"],
                ] as const
              ).map(([type, Icon, label]) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={discountType === type}
                  aria-label={label}
                  title={label}
                  onClick={() => onDiscountTypeChange(type)}
                  className={cn(
                    "flex h-8 w-9 items-center justify-center rounded-md transition-colors",
                    discountType === type
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </fieldset>
          </div>
        </div>

        {taxRows.length > 0 || taxTypes.length > 0 ? (
          <div className="space-y-2">
            <span className="text-muted-foreground">Taxes</span>
            {taxRows.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <NativeSelect
                  value={row.taxId}
                  onChange={(e) => onTaxChange(row.key, e.target.value)}
                  className="min-w-0 flex-1"
                  aria-label="Tax"
                >
                  <option value="">Select tax</option>
                  {taxTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.percent}%)
                    </option>
                  ))}
                </NativeSelect>
                <span className="w-20 shrink-0 text-right font-medium tabular-nums text-foreground">
                  {money(row.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveTax(row.key)}
                  aria-label="Remove tax"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {taxTypes.length > 0 ? (
              <button
                type="button"
                onClick={onAddTax}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add tax
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {money(grandTotal)}
          </span>
        </div>
      </div>
      {footer ? (
        <div className="hidden flex-col gap-2 border-t border-border px-5 py-4 lg:flex">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

/** Content of the sticky mobile bar: total on the left, actions on the right. */
export function MobileTotalBar({
  label = "Total",
  total,
  children,
}: {
  label?: string;
  total: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-bold tabular-nums text-foreground">
          {total}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Attachments                                                         */
/* ------------------------------------------------------------------ */

export function AttachmentDropzone({
  onClick,
  uploading = false,
}: {
  onClick: () => void;
  uploading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={uploading}
      className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 disabled:opacity-60"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
        {uploading ? (
          <Spinner className="h-4 w-4 text-primary" />
        ) : (
          <Upload className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <span>
        <span className="block text-sm font-medium text-foreground">
          {uploading ? "Uploading…" : "Add attachment"}
        </span>
        <span className="block text-xs text-muted-foreground">
          PNG, JPG, GIF, WebP — max 25 MB
        </span>
      </span>
    </button>
  );
}

export type AttachmentEntry = {
  key: string;
  name: string;
  size: string;
  isImage: boolean;
  href?: string;
};

export function AttachmentList({
  entries,
  onRemove,
  removing = false,
}: {
  entries: AttachmentEntry[];
  onRemove: (key: string) => void;
  removing?: boolean;
}) {
  if (entries.length === 0) return null;
  return (
    <ul className="mt-3 space-y-2">
      {entries.map((entry) => {
        const Icon = entry.isImage ? ImageIcon : FileText;
        return (
          <li
            key={entry.key}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            {entry.href ? (
              <a
                href={entry.href}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-foreground underline-offset-2 hover:underline"
              >
                {entry.name}
              </a>
            ) : (
              <span className="min-w-0 flex-1 truncate text-foreground">
                {entry.name}
              </span>
            )}
            <span className="shrink-0 text-xs text-muted-foreground">
              {entry.size}
            </span>
            <button
              type="button"
              disabled={removing}
              onClick={() => onRemove(entry.key)}
              aria-label={`Remove ${entry.name}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
