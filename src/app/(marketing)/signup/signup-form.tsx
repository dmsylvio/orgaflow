"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [step, setStep] = useState<Step>("account");
  const router = useRouter();
  const m = trpc.auth.signup.useMutation();

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

  const submit = async () => {
    // se não digitou slug manualmente, sugere
    const currentSlug = orgForm.getValues("slug") || suggestedSlug;
    orgForm.setValue("slug", currentSlug);

    const ok = await orgForm.trigger();
    if (!ok) return;

    const payload = {
      ...accountForm.getValues(),
      ...orgForm.getValues(),
      slug: currentSlug,
    };

    await m.mutateAsync(payload);

    // autentica e direciona ao app
    const res = await signIn("credentials", {
      email: accountForm.getValues("email"),
      password: accountForm.getValues("password"),
      redirect: false,
    });

    if (res?.ok) router.replace("/app");
  };

  return (
    <div className="rounded border p-6 shadow-sm bg-white">
      <h1 className="text-xl font-semibold mb-1">Create your account</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Acesse sua conta para continuar.
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
            <button
              type="submit"
              className="rounded bg-red-700 text-white px-4 py-2"
            >
              Continue
            </button>
          </div>
        </form>
      )}

      {step === "org" && (
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
              placeholder="Minha Empresa"
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
              placeholder={suggestedSlug || "minha-empresa"}
              {...orgForm.register("slug")}
            />
            {orgForm.formState.errors.slug && (
              <p className="text-sm text-red-600">
                {orgForm.formState.errors.slug.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Use apenas minúsculas, números e hífen.
            </p>
          </div>

          {m.error && <p className="text-sm text-red-600">{m.error.message}</p>}

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
              disabled={m.isPending}
              className="rounded bg-red-700 text-white px-4 py-2"
            >
              {m.isPending ? "Creating..." : "Create account"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
