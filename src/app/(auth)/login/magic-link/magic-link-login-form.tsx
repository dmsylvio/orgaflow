"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthAlternative } from "@/components/auth/auth-alternative";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { MagicLinkSent } from "@/components/auth/magic-link-sent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPaths } from "@/lib/app-paths";
import { authClient } from "@/lib/auth-client";
import { magicLinkErrorMessage } from "@/lib/magic-link-errors";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { toast } from "@/lib/toast";
import {
  type MagicLinkLoginValues,
  magicLinkLoginSchema,
} from "@/schemas/magic-link";

export function MagicLinkLoginForm() {
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(
    searchParams.get("next"),
    appPaths.workspace,
  );
  const nextQuery =
    nextPath !== appPaths.workspace
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";

  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // A failed link lands back here with `?error=…`.
  const errorCode = searchParams.get("error");
  useEffect(() => {
    if (!errorCode) return;
    toast.error("Couldn't sign you in", {
      description: magicLinkErrorMessage(errorCode),
    });
  }, [errorCode]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MagicLinkLoginValues>({
    resolver: zodResolver(magicLinkLoginSchema),
    defaultValues: { email: "" },
  });

  async function sendLink(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: nextPath,
      newUserCallbackURL: appPaths.workspace,
      errorCallbackURL: `/login/magic-link${nextQuery}`,
    });

    if (error) {
      toast.error("Couldn't send the link", {
        description: error.message ?? "Please try again in a moment.",
      });
      return false;
    }

    setSentTo(email);
    return true;
  }

  if (sentTo) {
    return (
      <AuthCard title="Sign in with an email link">
        <MagicLinkSent
          email={sentTo}
          resending={resending}
          onResend={async () => {
            setResending(true);
            const ok = await sendLink(sentTo);
            setResending(false);
            if (ok) toast.success("New link sent");
          }}
          onChangeEmail={() => {
            setSentTo(null);
            reset({ email: "" });
          }}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in with an email link"
      description="No password needed. We'll email you a link that signs you in."
    >
      <form
        onSubmit={handleSubmit(async ({ email }) => {
          await sendLink(email);
        })}
        noValidate
        className="flex flex-col gap-4"
      >
        <AuthField id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
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
          {isSubmitting ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>

      <AuthAlternative
        href={`/login${nextQuery}`}
        label="Sign in with a password"
        Icon={KeyRound}
      />

      <p className="mt-2 text-center text-sm text-muted-foreground">
        No account?{" "}
        <NextLink
          href={`/register/magic-link${nextQuery}`}
          className="font-medium text-primary hover:underline"
        >
          Create one
        </NextLink>
      </p>
    </AuthCard>
  );
}
