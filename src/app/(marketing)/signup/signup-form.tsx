"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { signupAccountSchema, signupOrgSchema } from "@/validations/auth";
import PlanSelector from "./plan-selector";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Step = "account" | "org" | "plan";

type PlanKey = "free" | "growth" | "enterprise";
type Interval = "month" | "year";

export default function SignupForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("account");
  const [signingUp, setSigningUp] = useState(false);
  const router = useRouter();
  const createOrg = trpc.org.create.useMutation();

  const initialPlan = (searchParams.get("plan") as PlanKey) || "free";
  const initialInterval =
    (searchParams.get("interval") as Interval) || "month";
  const [plan, setPlan] = useState<PlanKey>(initialPlan);
  const [interval, setInterval] = useState<Interval>(initialInterval);

  const accountForm = useForm<z.infer<typeof signupAccountSchema>>({
    resolver: zodResolver(signupAccountSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const orgForm = useForm<z.infer<typeof signupOrgSchema>>({
    resolver: zodResolver(signupOrgSchema),
    defaultValues: { orgName: "", slug: "" },
  });

  // ajuda: preenche slug conforme orgName
  const orgName = orgForm.watch("orgName");
  const suggestedSlug = useMemo(() => slugify(orgName || ""), [orgName]);

  const goNext = async () => {
    const ok = await accountForm.trigger();
    if (ok) setStep("org");
  };

  const goPlan = async () => {
    const ok = await orgForm.trigger();
    if (ok) setStep("plan");
  };

  const submit = async () => {
    const manualSlug = orgForm.getValues("slug")?.trim();
    const currentSlug =
      manualSlug || (suggestedSlug.length >= 2 ? suggestedSlug : "org");
    orgForm.setValue("slug", currentSlug);

    const ok = await orgForm.trigger();
    if (!ok) return;

    const account = accountForm.getValues();
    setSigningUp(true);

    try {
      const signUp = await authClient.signUp.email({
        name: account.name,
        email: account.email,
        password: account.password,
        callbackURL: "/app",
      });

      if (signUp.error) {
        toast.error(signUp.error.message ?? "Sign up failed", {
          description: "Please check your details and try again.",
        });
        return;
      }

      const org = await createOrg.mutateAsync({
        name: orgForm.getValues("orgName"),
        slug: currentSlug,
      });

      if (plan === "free") {
        toast.success("Account created", {
          description: "Redirecting to your dashboard...",
        });
        router.replace("/app");
        return;
      }

      const checkoutRes = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          interval,
          orgName: orgForm.getValues("orgName"),
          orgId: org.org.id,
        }),
      });

      const payload = (await checkoutRes.json()) as { url?: string };
      if (!checkoutRes.ok || !payload.url) {
        throw new Error("Checkout failed");
      }

      window.location.href = payload.url;
    } catch (error) {
      toast.error("Unexpected error", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setSigningUp(false);
    }
  };

  if (step === "plan") {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="text-xs text-neutral-500">Step 3 of 3</div>
          <h1 className="mt-2 text-2xl font-semibold">Choose your plan</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Pick the plan that fits your organization.
          </p>
        </div>

        <PlanSelector
          plan={plan}
          interval={interval}
          onPlanChange={setPlan}
          onIntervalChange={setInterval}
        />

        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            onClick={() => setStep("org")}
            className="rounded border px-4 py-2"
          >
            Back
          </Button>

          <Button
            type="button"
            onClick={() => void submit()}
            disabled={createOrg.isPending || signingUp}
            className="rounded bg-black text-white px-6 py-2"
          >
            {createOrg.isPending || signingUp
              ? "Processing..."
              : plan === "free"
                ? "Create account"
                : "Continue to payment"}
          </Button>
        </div>

        <div className="text-center text-sm text-neutral-600">
          <Link href="/auth/sign-in" className="hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Step {step === "account" ? 1 : step === "org" ? 2 : 3} of 3</span>
        <span>Orgaflow setup</span>
      </div>
      <h1 className="mt-4 text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Set up your workspace in just a few steps.
      </p>
      {step === "account" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void goNext();
          }}
        >
          <div>
            <Label className="block text-sm font-medium">Full name</Label>
            <Input
              className="mt-1 w-full border rounded px-3 py-2"
              {...accountForm.register("name")}
            />
            {accountForm.formState.errors.name && (
              <p className="text-sm text-red-600">
                {accountForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label className="block text-sm font-medium">Email</Label>
            <Input
              className="mt-1 w-full border rounded px-3 py-2"
              {...accountForm.register("email")}
            />
            {accountForm.formState.errors.email && (
              <p className="text-sm text-red-600">
                {accountForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label className="block text-sm font-medium">Password</Label>
            <Input
              type="password"
              className="mt-1 w-full border rounded px-3 py-2"
              {...accountForm.register("password")}
            />
            {accountForm.formState.errors.password && (
              <p className="text-sm text-red-600">
                {accountForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full rounded-md bg-black text-white py-2"
            >
              Continue
            </Button>
          </div>
        </form>
      )}

      {step === "org" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void goPlan();
          }}
        >
          <div>
            <Label className="block text-sm font-medium">
              Organization name
            </Label>
            <Input
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="Acme Inc."
              {...orgForm.register("orgName")}
            />
            {orgForm.formState.errors.orgName && (
              <p className="text-sm text-red-600">
                {orgForm.formState.errors.orgName.message}
              </p>
            )}
          </div>

          <div>
            <Label className="block text-sm font-medium">
              Slug <span className="text-gray-500">(url)</span>
            </Label>
            <Input
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder={suggestedSlug || "acme-inc"}
              {...orgForm.register("slug")}
            />
            {orgForm.formState.errors.slug && (
              <p className="text-sm text-red-600">
                {orgForm.formState.errors.slug.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Use lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {createOrg.error && (
            <p className="text-sm text-red-600">{createOrg.error.message}</p>
          )}

          <div className="flex items-center gap-2 pt-4">
            <Button
              type="button"
              onClick={() => setStep("account")}
              className="rounded border px-4 py-2"
            >
              Back
            </Button>

            <Button
              type="submit"
              className="rounded bg-black text-white px-4 py-2"
            >
              Continue
            </Button>
          </div>
        </form>
      )}


      {/* Plan step handled above */}

      <div className="mt-6 text-sm text-neutral-600">
        <Link href="/auth/sign-in" className="hover:underline">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
