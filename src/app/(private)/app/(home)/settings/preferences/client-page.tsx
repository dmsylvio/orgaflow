"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyPicker } from "@/components/ui/currency-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguagePicker } from "@/components/ui/language-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { TimezonePicker } from "@/components/ui/timezone-picker";
import { toast } from "@/lib/toast";
import {
  DATE_FORMAT_VALUES,
  type DateFormatValue,
  FINANCIAL_YEAR_VALUES,
  type FinancialYearValue,
} from "@/server/db/schemas";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATE_FORMAT_LABELS: Record<DateFormatValue, string> = {
  YYYY_MMM_DD: "2026 Mar 22",
  DD_MMM_YYYY: "22 Mar 2026",
  "DD/MM/YYYY": "22/03/2026",
  "DD.MM.YYYY": "22.03.2026",
  "DD-MM-YYYY": "22-03-2026",
  "MM/DD/YYYY": "03/22/2026",
  "YYYY/MM/DD": "2026/03/22",
  "YYYY-MM-DD": "2026-03-22",
};

const FINANCIAL_YEAR_LABELS: Record<FinancialYearValue, string> = {
  "january-december": "January – December",
  "february-january": "February – January",
  "march-february": "March – February",
  "april-march": "April – March",
  "may-april": "May – April",
  "june-may": "June – May",
  "july-june": "July – June",
  "august-july": "August – July",
  "september-august": "September – August",
  "october-september": "October – September",
  "november-october": "November – October",
  "december-november": "December – November",
};

function isDateFormatValue(value: string): value is DateFormatValue {
  return DATE_FORMAT_VALUES.includes(value as DateFormatValue);
}

function isFinancialYearValue(value: string): value is FinancialYearValue {
  return FINANCIAL_YEAR_VALUES.includes(value as FinancialYearValue);
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="mb-8" />
      <div className="space-y-8">{children}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {htmlFor ? (
        <Label htmlFor={htmlFor}>{label}</Label>
      ) : (
        <p className="text-sm font-medium leading-none text-foreground">
          {label}
        </p>
      )}
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PreferencesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery(
    trpc.settings.getPreferences.queryOptions(),
  );

  const { data: languageOptions = [] } = useQuery(
    trpc.workspace.listLanguages.queryOptions(),
  );

  // ---- State ----------------------------------------------------------------
  const [defaultCurrencyId, setDefaultCurrencyId] = useState("");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState<DateFormatValue>("DD/MM/YYYY");
  const [financialYearStart, setFinancialYearStart] =
    useState<FinancialYearValue>("january-december");
  const [publicLinksExpireEnabled, setPublicLinksExpireEnabled] =
    useState(false);
  const [publicLinksExpireDays, setPublicLinksExpireDays] = useState(7);
  const [discountPerItem, setDiscountPerItem] = useState(false);

  // ---- Hydrate from server --------------------------------------------------
  useEffect(() => {
    if (!data) return;
    const p = data.prefs;
    setDefaultCurrencyId(p?.defaultCurrencyId ?? "");
    setLanguage(p?.language ?? "en");
    setTimezone(p?.timezone ?? "UTC");
    setDateFormat(
      p?.dateFormat && isDateFormatValue(p.dateFormat)
        ? p.dateFormat
        : "DD/MM/YYYY",
    );
    setFinancialYearStart(
      p?.financialYearStart && isFinancialYearValue(p.financialYearStart)
        ? p.financialYearStart
        : "january-december",
    );
    setPublicLinksExpireEnabled(p?.publicLinksExpireEnabled ?? true);
    setPublicLinksExpireDays(p?.publicLinksExpireDays ?? 7);
    setDiscountPerItem(p?.discountPerItem ?? false);
  }, [data]);

  // ---- Mutation -------------------------------------------------------------
  const update = useMutation(
    trpc.settings.updatePreferences.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.getPreferences.queryOptions(),
        );
        toast.success("Preferences saved.");
      },
      onError: (e) =>
        toast.error("Couldn't save preferences", { description: e.message }),
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      defaultCurrencyId: defaultCurrencyId || null,
      language,
      timezone,
      dateFormat,
      financialYearStart,
      publicLinksExpireEnabled,
      publicLinksExpireDays,
      discountPerItem,
    });
  }

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <SettingsPage
      title="Preferences"
      description="Default system settings for your organization."
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Locale */}
        <Section title="Locale & display">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Default currency"
              htmlFor="pref-currency"
              hint="Set during organization creation. Contact support to change."
            >
              <CurrencyPicker
                id="pref-currency"
                currencies={data?.currencies ?? []}
                value={defaultCurrencyId}
                onValueChange={setDefaultCurrencyId}
                disabled
              />
            </Field>

            <Field label="Default Language" htmlFor="pref-lang">
              <LanguagePicker
                id="pref-lang"
                languages={languageOptions}
                value={language}
                onValueChange={setLanguage}
              />
            </Field>

            <Field label="Timezone" htmlFor="pref-tz">
              <TimezonePicker
                id="pref-tz"
                value={timezone}
                onValueChange={setTimezone}
              />
            </Field>

            <Field
              label="Date format"
              htmlFor="pref-date"
              hint="How dates are displayed across the entire system — tables, documents, charts, and reports."
            >
              <Select
                value={dateFormat}
                onValueChange={(v) => setDateFormat(v as DateFormatValue)}
              >
                <SelectTrigger id="pref-date">
                  <span>{DATE_FORMAT_LABELS[dateFormat]}</span>
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMAT_VALUES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {DATE_FORMAT_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Financial year"
              htmlFor="pref-fy"
              hint="Start month for financial year reports."
            >
              <Select
                value={financialYearStart}
                onValueChange={(v) =>
                  setFinancialYearStart(v as FinancialYearValue)
                }
              >
                <SelectTrigger id="pref-fy">
                  <span>{FINANCIAL_YEAR_LABELS[financialYearStart]}</span>
                </SelectTrigger>
                <SelectContent>
                  {FINANCIAL_YEAR_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {FINANCIAL_YEAR_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        {/* Public links */}
        <Section title="Public links">
          <div className="space-y-4">
            <SwitchRow
              id="pref-links-expire"
              label="Automatically expire public links"
              description="Specify whether you would like to expire all the links sent by application to view invoices, estimates & payments, etc after a specified duration."
              checked={publicLinksExpireEnabled}
              onCheckedChange={setPublicLinksExpireEnabled}
            />
            {publicLinksExpireEnabled ? (
              <Field
                label="Automatically Expire Public Links"
                htmlFor="pref-links-days"
              >
                <Input
                  id="pref-links-days"
                  type="number"
                  min={1}
                  max={365}
                  value={publicLinksExpireDays}
                  onChange={(e) =>
                    setPublicLinksExpireDays(Number(e.target.value))
                  }
                  className="w-full"
                />
              </Field>
            ) : null}
          </div>
        </Section>

        {/* Documents */}
        <Section title="Documents">
          <SwitchRow
            id="pref-discount"
            label="Discount per item"
            description="Allow setting a discount individually on each line item in estimates and invoices."
            checked={discountPerItem}
            onCheckedChange={setDiscountPerItem}
          />
        </Section>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={update.isPending}
            disabled={update.isPending}
          >
            Save preferences
          </Button>
        </div>
      </form>
    </SettingsPage>
  );
}
