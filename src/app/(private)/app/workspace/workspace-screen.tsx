"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyPicker } from "@/components/ui/currency-picker";
import { Input } from "@/components/ui/input";
import { LanguagePicker } from "@/components/ui/language-picker";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { appPaths } from "@/lib/app-paths";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  createOrganizationDetailsSchema,
  createOrganizationInputSchema,
  type WorkspaceBillingInterval,
  type WorkspacePlan,
} from "@/schemas/workspace";
import { useTRPC } from "@/trpc/client";
import { OrgCardScroll, PlanScroll, WorkspaceHero } from "./workspace-ui";

// ---------------------------------------------------------------------------
// Local primitives
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}

function FormField({ label, htmlFor, children, hint }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="mb-4 app-card p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

// Step breadcrumb pill indicator
type FlowStep = "pick-org" | "create-details" | "create-plan";

const STEPS: { id: FlowStep; label: string }[] = [
  { id: "create-details", label: "Details" },
  { id: "create-plan", label: "Plan" },
];

function StepIndicator({ current }: { current: FlowStep }) {
  return (
    <ol className="mb-8 flex items-center gap-3" aria-label="Progress">
      {STEPS.map((step, i) => {
        const active = current === step.id;
        const done = current === "create-plan" && step.id === "create-details";
        return (
          <li key={step.id} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden className="h-px w-8 bg-border" />}
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function WorkspaceScreen() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: organizations, isPending } = useQuery(
    trpc.workspace.listMyOrganizations.queryOptions(),
  );

  const [step, setStep] = useState<FlowStep>("pick-org");

  // Start each step at the top of the page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: step is the trigger
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [languageCode, setLanguageCode] = useState("en");
  const [defaultCurrencyId, setDefaultCurrencyId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<WorkspacePlan | null>(null);
  const [billingInterval, setBillingInterval] =
    useState<WorkspaceBillingInterval>("monthly");

  const referenceEnabled = step === "create-details" || step === "create-plan";

  const { data: currencyOptions = [], isPending: currenciesPending } = useQuery(
    {
      ...trpc.workspace.listCurrencies.queryOptions(),
      enabled: referenceEnabled,
    },
  );

  const { data: languageOptions = [], isPending: languagesPending } = useQuery({
    ...trpc.workspace.listLanguages.queryOptions(),
    enabled: referenceEnabled,
  });

  const referencePending = currenciesPending || languagesPending;

  useEffect(() => {
    if (currencyOptions.length > 0 && !defaultCurrencyId) {
      const usd = currencyOptions.find((c) => c.code === "USD");
      if (usd) setDefaultCurrencyId(usd.id);
    }
  }, [currencyOptions, defaultCurrencyId]);

  const setActive = useMutation(
    trpc.workspace.setActiveOrganization.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        router.push(appPaths.home);
        router.refresh();
      },
      onError: (e) => {
        toast.error("Couldn't open organization", { description: e.message });
      },
    }),
  );

  const createOrg = useMutation(
    trpc.workspace.createOrganization.mutationOptions({
      onError: (e) => {
        toast.error("Couldn't create organization", { description: e.message });
      },
    }),
  );

  const resumeCheckout = useMutation(
    trpc.workspace.resumeOrganizationCheckout.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
      onError: (e) => {
        toast.error("Couldn't continue checkout", { description: e.message });
      },
    }),
  );

  function buildDetailsPayload() {
    return {
      name: orgName,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      businessPhone,
      languageCode,
      defaultCurrencyId,
    };
  }

  async function handleAccessOrganization(organizationId: string) {
    try {
      await setActive.mutateAsync({ organizationId });
    } catch {
      // error handled in mutation onError
    }
  }

  async function handleCreateOrganization() {
    if (!selectedPlan) {
      toast.warning("Plan required", {
        description: "Choose a plan before creating the organization.",
      });
      return;
    }

    const parsed = createOrganizationInputSchema.safeParse({
      ...buildDetailsPayload(),
      plan: selectedPlan,
      billingInterval,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error("Check your details", {
        description: first?.message ?? "Review the form fields and try again.",
      });
      return;
    }

    try {
      const result = await createOrg.mutateAsync(parsed.data);

      if (result.next.type === "redirect") {
        window.location.href = result.next.url;
        return;
      }
    } catch {
      // error handled in mutation onError
    }
  }

  async function handleResumeBilling(organizationId: string) {
    try {
      const result = await resumeCheckout.mutateAsync({ organizationId });
      window.location.href = result.url;
    } catch {
      // error handled in mutation onError
    }
  }

  function handleStartCreate() {
    setOrgName("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setRegion("");
    setPostalCode("");
    setBusinessPhone("");
    setLanguageCode("en");
    setDefaultCurrencyId("");
    setSelectedPlan(null);
    setBillingInterval("monthly");
    setStep("create-details");
  }

  function handleDetailsNext() {
    const parsed = createOrganizationDetailsSchema.safeParse(
      buildDetailsPayload(),
    );
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error("Check your details", {
        description: first?.message ?? "Review the form fields and try again.",
      });
      return;
    }
    setStep("create-plan");
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (isPending) {
    return (
      <div className="flex min-h-96 items-center justify-center p-8">
        <div className="flex items-center gap-3 app-card p-6">
          <Spinner className="size-5 text-primary" label="Loading" />
          <p className="text-sm text-muted-foreground">
            Loading your workspace…
          </p>
        </div>
      </div>
    );
  }

  const orgList = organizations ?? [];

  // -------------------------------------------------------------------------
  // Step 1 — Details
  // -------------------------------------------------------------------------

  if (step === "create-details") {
    const canSubmitReferences =
      languageOptions.length > 0 && currencyOptions.length > 0;

    return (
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6">
        <StepIndicator current="create-details" />
        <h1 className="app-page-title mb-1">Organization details</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Name, optional phone, registered address, default language, and
          currency. The URL slug is generated automatically from the name.
        </p>

        {referencePending ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <Spinner className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              Loading reference data…
            </span>
          </div>
        ) : (
          <>
            <FormSection title="Organization">
              <div className="flex flex-col gap-4">
                <FormField label="Organization name" htmlFor="org-name">
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Studio Lda."
                    autoComplete="organization"
                  />
                </FormField>
                <FormField label="Phone" htmlFor="org-phone">
                  <Input
                    id="org-phone"
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="Optional"
                    autoComplete="tel"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Registered address">
              <div className="flex flex-col gap-4">
                <FormField label="Street address" htmlFor="org-addr1">
                  <Input
                    id="org-addr1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street, number, floor"
                    autoComplete="street-address"
                  />
                </FormField>
                <FormField label="Address line 2" htmlFor="org-addr2">
                  <Input
                    id="org-addr2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Suite, building (optional)"
                    autoComplete="address-line2"
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="City" htmlFor="org-city">
                    <Input
                      id="org-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      autoComplete="address-level2"
                    />
                  </FormField>
                  <FormField label="Postal code" htmlFor="org-postal">
                    <Input
                      id="org-postal"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="ZIP / postal code"
                      autoComplete="postal-code"
                    />
                  </FormField>
                </div>
                <FormField label="Region / state" htmlFor="org-region">
                  <Input
                    id="org-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Optional"
                    autoComplete="address-level1"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Language & currency">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Default Language"
                  htmlFor="org-language"
                  hint="Can be changed later in Preferences."
                >
                  <LanguagePicker
                    id="org-language"
                    languages={languageOptions}
                    value={languageCode}
                    onValueChange={setLanguageCode}
                  />
                </FormField>
                <FormField
                  label="Default currency"
                  htmlFor="org-currency"
                  hint="Can be changed later in Preferences."
                >
                  <CurrencyPicker
                    id="org-currency"
                    currencies={currencyOptions}
                    value={defaultCurrencyId}
                    onValueChange={setDefaultCurrencyId}
                  />
                </FormField>
              </div>
            </FormSection>

            <Separator className="my-6" />
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("pick-org")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDetailsNext}
                disabled={!canSubmitReferences}
              >
                Continue to plan
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step 2 — Plan
  // -------------------------------------------------------------------------

  if (step === "create-plan") {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6">
        <StepIndicator current="create-plan" />
        <h1 className="app-page-title mb-1">Choose a plan</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Starter is free and opens immediately. Growth expands capacity, and
          Scale unlocks payments and automation.
        </p>
        <PlanScroll
          billingInterval={billingInterval}
          onBillingIntervalChange={setBillingInterval}
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          onCreateOrganization={handleCreateOrganization}
          isCreatePending={createOrg.isPending}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Default — Pick org
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
      <WorkspaceHero hasWorkspaces={orgList.length > 0} />

      {orgList.length > 0 ? (
        <OrgCardScroll
          organizations={orgList}
          selectedId={selectedOrgId}
          onSelect={setSelectedOrgId}
          onAccessOrganization={handleAccessOrganization}
          onResumeBilling={handleResumeBilling}
          isAccessPending={setActive.isPending}
          isResumePending={resumeCheckout.isPending}
        />
      ) : null}

      <button
        type="button"
        onClick={handleStartCreate}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Plus className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {orgList.length === 0
              ? "Create your first workspace"
              : "Create a new workspace"}
          </span>
          <span className="block text-sm text-muted-foreground">
            Starter is free. Upgrade any time.
          </span>
        </span>
      </button>
    </div>
  );
}
