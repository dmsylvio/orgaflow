"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import {
  type AuthMethod,
  AuthMethodTabs,
} from "@/components/auth/auth-method-tabs";
import { MagicLinkSent } from "@/components/auth/magic-link-sent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPaths } from "@/lib/app-paths";
import { authClient } from "@/lib/auth-client";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { toast } from "@/lib/toast";
import { type LoginFormValues, loginSchema } from "@/schemas/login";
import {
  type MagicLinkLoginValues,
  magicLinkLoginSchema,
} from "@/schemas/magic-link";

const MAGIC_LINK_ERRORS: Record<string, string> = {
  INVALID_TOKEN: "That sign-in link is invalid. Request a new one.",
  EXPIRED_TOKEN: "That sign-in link has expired. Request a new one.",
  ATTEMPTS_EXCEEDED: "That sign-in link was already used. Request a new one.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(
    searchParams.get("next"),
    appPaths.workspace,
  );
  const nextQuery =
    nextPath !== appPaths.workspace
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";

  const [method, setMethod] = useState<AuthMethod>("magic-link");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // A failed magic link lands back here with `?error=…`.
  const errorCode = searchParams.get("error");
  useEffect(() => {
    if (!errorCode) return;
    toast.error("Couldn't sign you in", {
      description:
        MAGIC_LINK_ERRORS[errorCode.toUpperCase()] ??
        "That sign-in link didn't work. Request a new one.",
    });
  }, [errorCode]);

  const passwordForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const magicForm = useForm<MagicLinkLoginValues>({
    resolver: zodResolver(magicLinkLoginSchema),
    defaultValues: { email: "" },
  });

  async function sendMagicLink(email: string) {
    const { error } = await authClient.signIn.magicLink({
      email: email.trim().toLowerCase(),
      callbackURL: nextPath,
      newUserCallbackURL: appPaths.workspace,
      errorCallbackURL: `/login${nextQuery}`,
    });

    if (error) {
      toast.error("Couldn't send the link", {
        description: error.message ?? "Please try again in a moment.",
      });
      return false;
    }

    setSentTo(email.trim().toLowerCase());
    return true;
  }

  if (sentTo) {
    return (
      <AuthCard title="Sign in to Orgaflow">
        <MagicLinkSent
          email={sentTo}
          resending={resending}
          onResend={async () => {
            setResending(true);
            const ok = await sendMagicLink(sentTo);
            setResending(false);
            if (ok) toast.success("New link sent");
          }}
          onChangeEmail={() => {
            setSentTo(null);
            magicForm.reset({ email: "" });
          }}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your workspace to continue."
    >
      <AuthMethodTabs value={method} onChange={setMethod} />

      {method === "magic-link" ? (
        <form
          onSubmit={magicForm.handleSubmit(async ({ email }) => {
            await sendMagicLink(email);
          })}
          noValidate
          className="flex flex-col gap-4"
        >
          <AuthField
            id="magic-email"
            label="Email"
            error={magicForm.formState.errors.email?.message}
          >
            <Input
              id="magic-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              aria-invalid={magicForm.formState.errors.email ? true : undefined}
              {...magicForm.register("email")}
            />
          </AuthField>

          <Button
            type="submit"
            loading={magicForm.formState.isSubmitting}
            disabled={magicForm.formState.isSubmitting}
            className="h-11 w-full text-[15px]"
            size="lg"
          >
            {magicForm.formState.isSubmitting
              ? "Sending link…"
              : "Email me a sign-in link"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No password needed. We'll email you a link that signs you in.
          </p>
        </form>
      ) : (
        <form
          onSubmit={passwordForm.handleSubmit(async (values) => {
            const { error } = await authClient.signIn.email({
              email: values.email.trim().toLowerCase(),
              password: values.password,
            });

            if (error) {
              toast.error("Couldn't sign in", {
                description: "Invalid email or password. Please try again.",
              });
              return;
            }

            router.push(nextPath);
            router.refresh();
          })}
          noValidate
          className="flex flex-col gap-4"
        >
          <AuthField
            id="email"
            label="Email"
            error={passwordForm.formState.errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={
                passwordForm.formState.errors.email ? true : undefined
              }
              {...passwordForm.register("email")}
            />
          </AuthField>

          <AuthField
            id="password"
            label="Password"
            error={passwordForm.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={
                passwordForm.formState.errors.password ? true : undefined
              }
              {...passwordForm.register("password")}
            />
          </AuthField>

          <div className="flex justify-end">
            <NextLink
              href={`/forgot-password${nextQuery}`}
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Forgot password?
            </NextLink>
          </div>

          <Button
            type="submit"
            loading={passwordForm.formState.isSubmitting}
            disabled={passwordForm.formState.isSubmitting}
            className="h-11 w-full text-[15px]"
            size="lg"
          >
            {passwordForm.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}

      <p className="mt-2 text-center text-sm text-muted-foreground">
        No account?{" "}
        <NextLink
          href={`/register${nextQuery}`}
          className="font-medium text-primary hover:underline"
        >
          Create one
        </NextLink>
      </p>
    </AuthCard>
  );
}
