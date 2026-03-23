"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "@/schemas/forgot-password";
import { forgotPasswordAction } from "@/server/actions/auth";

export function ForgotPasswordForm() {
  const [rootError, setRootError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <AuthCard
      title="Forgot password"
      description="We'll email you a link to reset your password if an account exists."
    >
      {sent ? (
        <output aria-live="polite">
          <Callout variant="success">
            If an account exists for that email, you will receive reset
            instructions shortly. In development, check the server console for
            the reset URL.
          </Callout>
        </output>
      ) : (
        <form
          onSubmit={handleSubmit(async (values) => {
            setRootError(null);
            const result = await forgotPasswordAction(values);

            if (!result.success) {
              if (result.fieldErrors) {
                for (const [key, message] of Object.entries(
                  result.fieldErrors,
                )) {
                  if (key === "email") {
                    setError("email", { message });
                  }
                }
              }
              setRootError(result.message);
              return;
            }

            setSent(true);
          })}
          noValidate
          className="flex flex-col gap-4"
        >
          {rootError ? (
            <Callout variant="error">
              <span role="alert">{rootError}</span>
            </Callout>
          ) : null}

          <AuthField id="email" label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </AuthField>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <NextLink
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Back to sign in
        </NextLink>
      </p>
    </AuthCard>
  );
}
