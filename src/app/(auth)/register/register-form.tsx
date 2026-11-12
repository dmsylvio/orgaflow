"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
import {
  type MagicLinkRegisterValues,
  magicLinkRegisterSchema,
} from "@/schemas/magic-link";
import { type RegisterFormValues, registerSchema } from "@/schemas/register";

export function RegisterForm() {
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
  const [sent, setSent] = useState<MagicLinkRegisterValues | null>(null);
  const [resending, setResending] = useState(false);

  const passwordForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const magicForm = useForm<MagicLinkRegisterValues>({
    resolver: zodResolver(magicLinkRegisterSchema),
    defaultValues: { name: "", email: "" },
  });

  async function sendMagicLink(values: MagicLinkRegisterValues) {
    const email = values.email.trim().toLowerCase();
    const { error } = await authClient.signIn.magicLink({
      email,
      name: values.name.trim(),
      callbackURL: nextPath,
      newUserCallbackURL: nextPath,
      errorCallbackURL: `/login${nextQuery}`,
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
            const ok = await sendMagicLink(sent);
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
      title="Create account"
      description="Start free. No credit card needed."
    >
      <AuthMethodTabs value={method} onChange={setMethod} />

      {method === "magic-link" ? (
        <form
          onSubmit={magicForm.handleSubmit(async (values) => {
            await sendMagicLink(values);
          })}
          noValidate
          className="flex flex-col gap-4"
        >
          <AuthField
            id="magic-name"
            label="Full name"
            error={magicForm.formState.errors.name?.message}
          >
            <Input
              id="magic-name"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="Jane Smith"
              aria-invalid={magicForm.formState.errors.name ? true : undefined}
              {...magicForm.register("name")}
            />
          </AuthField>

          <AuthField
            id="magic-email"
            label="Email"
            error={magicForm.formState.errors.email?.message}
          >
            <Input
              id="magic-email"
              type="email"
              autoComplete="email"
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
              : "Create account with email link"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            We'll email you a link. Clicking it creates your account and signs
            you in.
          </p>
        </form>
      ) : (
        <form
          onSubmit={passwordForm.handleSubmit(async (values) => {
            const { error } = await authClient.signUp.email({
              name: values.name.trim(),
              email: values.email.trim().toLowerCase(),
              password: values.password,
            });

            if (error) {
              toast.error("Couldn't create account", {
                description:
                  error.code === "USER_ALREADY_EXISTS" ||
                  error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
                    ? "An account with this email already exists."
                    : (error.message ?? "Please try again."),
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
            id="name"
            label="Full name"
            error={passwordForm.formState.errors.name?.message}
          >
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              aria-invalid={
                passwordForm.formState.errors.name ? true : undefined
              }
              {...passwordForm.register("name")}
            />
          </AuthField>

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
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={
                passwordForm.formState.errors.password ? true : undefined
              }
              {...passwordForm.register("password")}
            />
          </AuthField>

          <AuthField
            id="confirmPassword"
            label="Confirm password"
            error={passwordForm.formState.errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={
                passwordForm.formState.errors.confirmPassword ? true : undefined
              }
              {...passwordForm.register("confirmPassword")}
            />
          </AuthField>

          <Button
            type="submit"
            loading={passwordForm.formState.isSubmitting}
            disabled={passwordForm.formState.isSubmitting}
            className="h-11 w-full text-[15px]"
            size="lg"
          >
            {passwordForm.formState.isSubmitting
              ? "Creating account…"
              : "Create account"}
          </Button>
        </form>
      )}

      <p className="mt-2 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <NextLink
          href={`/login${nextQuery}`}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </NextLink>
      </p>
    </AuthCard>
  );
}
