"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/trpc/client";

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
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function CompanySettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery(trpc.settings.getCompany.queryOptions());

  const [name, setName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    if (!data?.org) return;
    const o = data.org;
    setName(o.name ?? "");
    setBusinessPhone(o.businessPhone ?? "");
    setAddressLine1(o.addressLine1 ?? "");
    setAddressLine2(o.addressLine2 ?? "");
    setCity(o.city ?? "");
    setRegion(o.region ?? "");
    setPostalCode(o.postalCode ?? "");
  }, [data?.org]);

  const update = useMutation(
    trpc.settings.updateCompany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.settings.getCompany.queryOptions());
        toast.success("Company details saved.");
      },
      onError: (e) =>
        toast.error("Couldn't save company details", {
          description: e.message,
        }),
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      name,
      businessPhone: businessPhone || null,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      city: city || null,
      region: region || null,
      postalCode: postalCode || null,
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
      title="Company Settings"
      description="Name, address, and default currency shown on estimates and invoices."
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identity */}
        <Section title="Identity">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Organization name" htmlFor="co-name">
              <Input
                id="co-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Studio Lda."
                autoComplete="organization"
                required
              />
            </Field>
            <Field label="Business phone" htmlFor="co-phone">
              <Input
                id="co-phone"
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="Optional"
                autoComplete="tel"
              />
            </Field>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Slug:{" "}
            <span className="font-mono text-foreground">{data?.org.slug}</span>
          </p>
        </Section>

        {/* Address */}
        <Section title="Registered address">
          <div className="space-y-4">
            <Field label="Street address" htmlFor="co-addr1">
              <Input
                id="co-addr1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Street, number, floor"
                autoComplete="street-address"
              />
            </Field>
            <Field label="Address line 2" htmlFor="co-addr2">
              <Input
                id="co-addr2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Suite, building (optional)"
                autoComplete="address-line2"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City" htmlFor="co-city">
                <Input
                  id="co-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="Postal code" htmlFor="co-postal">
                <Input
                  id="co-postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="ZIP / postal code"
                  autoComplete="postal-code"
                />
              </Field>
            </div>
            <Field label="Region / state" htmlFor="co-region">
              <Input
                id="co-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Optional"
                autoComplete="address-level1"
              />
            </Field>
          </div>
        </Section>

<div className="flex justify-end">
          <Button
            type="submit"
            loading={update.isPending}
            disabled={update.isPending || !name.trim()}
          >
            Save changes
          </Button>
        </div>
      </form>
    </SettingsPage>
  );
}
