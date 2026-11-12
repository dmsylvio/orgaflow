"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthAlternative } from "@/components/auth/auth-alternative";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { MagicLinkSent } from "@/components/auth/magic-link-sent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPaths } from "@/lib/app-paths";
import { authClient } from "@/lib/auth-client";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { toast } from "@/lib/toast";
import {
  type MagicLinkRegisterValues,
  magicLinkRegisterSchema,
} from "@/schemas/magic-link";

export function MagicLinkRegisterForm() {
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(
    searchParams.get("next"),
    appPaths.workspace,
  );
  const nextQuery =
    nextPath !== appPaths.workspace
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";

  const [sent, setSent] = useState<MagicLinkRegisterValues | null>(null);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MagicLinkRegisterValues>({
    resolver: zodResolver(magicLinkRegisterSchema),
    defaultValues: { name: "", email: "" },
  });

  async function sendLink(values: MagicLinkRegisterValues) {
    const email = values.email.trim().toLowerCase();
    const { error } = await authClient.signIn.magicLink({
      email,
      name: values.name.trim(),
      callbackURL: nextPath,
      newUserCallbackURL: nextPath,
      errorCallbackURL: `/login/magic-link${nextQuery}`,
    });

    if (error) {
      toast.error("Couldn't send the link", {
        description: error.message ?? "Please try again in a moment.",
      });
      return false;
    }

    setSent({ name: values.name, email });
    return true;
  }

  if (sent) {
    return (
      <AuthCard title="Create your account">
        <MagicLinkSent
          email={sent.email}
          resending={resending}
          onResend={async () => {
            setResending(true);
            const ok = await sendLink(sent);
            setResending(false);
            if (ok) toast.success("New link sent");
          }}
          onChangeEmail={() => setSent(null)}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create account with an email link"
      description="No password to remember. Clicking the link we send creates your account and signs you in."
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          await sendLink(values);
        })}
        noValidate
        className="flex flex-col gap-4"
      >
        <AuthField id="name" label="Full name" error={errors.name?.message}>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            autoFocus
            placeholder="Jane Smith"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
          />
        </AuthField>

        <AuthField id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
        </AuthField>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="h-11 w-full text-[15px]"
          size="lg"
        >
          {isSubmitting ? "Sending link…" : "Email me a sign-up link"}
        </Button>
      </form>

      <AuthAlternative
        href={`/register${nextQuery}`}
        label="Sign up with a password"
        Icon={KeyRound}
      />

      <p className="mt-2 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <NextLink
          href={`/login/magic-link${nextQuery}`}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </NextLink>
      </p>
    </AuthCard>
  );
}
