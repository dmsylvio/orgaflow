"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { signupAccountSchema, signupOrgSchema } from "@/validations/auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Step = "account" | "org";


export default function SignupForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const [step, setStep] = useState<Step>("account");
  const [signingUp, setSigningUp] = useState(false);
  const router = useRouter();
  const createOrg = trpc.org.create.useMutation();
  const acceptInvite = trpc.invitations.accept.useMutation();
  const inviteInfo = trpc.invitations.getByToken.useQuery(
    { token: inviteToken },
    { enabled: !!inviteToken },
  );

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

  useEffect(() => {
    orgForm.setValue("slug", suggestedSlug);
  }, [suggestedSlug, orgForm.setValue]);

  const goNext = async () => {
    const ok = await accountForm.trigger();
    if (ok) setStep(inviteToken ? "account" : "org");
  };

  const submit = async () => {
    if (!inviteToken) {
      const manualSlug = orgForm.getValues("slug")?.trim();
      const currentSlug =
        manualSlug || (suggestedSlug.length >= 2 ? suggestedSlug : "org");
      orgForm.setValue("slug", currentSlug);

      const ok = await orgForm.trigger();
      if (!ok) return;
    }

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

      if (inviteToken) {
        await acceptInvite.mutateAsync({ token: inviteToken });
        toast.success("Invitation accepted", {
          description: "Redirecting to the organization...",
        });
        router.replace("/app");
        return;
      }

      const manualSlug = orgForm.getValues("slug")?.trim();
      const currentSlug =
        manualSlug || (suggestedSlug.length >= 2 ? suggestedSlug : "org");
      const org = await createOrg.mutateAsync({
        name: orgForm.getValues("orgName"),
        slug: currentSlug,
      });

      toast.success("Account created", {
        description: "Choose a plan to continue.",
      });

      const params = new URLSearchParams({
        orgId: org.org.id,
        orgName: orgForm.getValues("orgName"),
      });
      router.replace(`/choose-plan?${params.toString()}`);
    } catch (error) {
      toast.error("Unexpected error", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setSigningUp(false);
    }
  };
  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Step {inviteToken ? 1 : step === "account" ? 1 : 2} of {inviteToken ? 1 : 2}</span>
        <span>Orgaflow setup</span>
      </div>
      <h1 className="mt-4 text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {inviteToken && inviteInfo.data?.org?.name
          ? `You’re invited to join ${inviteInfo.data.org.name}.`
          : "Set up your workspace in just a few steps."}
      </p>
      {step === "account" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (inviteToken) {
              void submit();
              return;
            }
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

      {!inviteToken && step === "org" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
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
              disabled={createOrg.isPending || signingUp}
              className="rounded bg-black text-white px-4 py-2"
            >
              {createOrg.isPending || signingUp
                ? "Processing..."
                : "Continue to choose plan"}
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
