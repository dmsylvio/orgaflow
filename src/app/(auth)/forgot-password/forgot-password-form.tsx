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
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "@/schemas/forgot-password";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
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
            instructions shortly. You can also sign in with an email link
            instead.
          </Callout>
        </output>
      ) : (
        <form
          onSubmit={handleSubmit(async (values) => {
            const { error } = await authClient.requestPasswordReset({
              email: values.email.trim().toLowerCase(),
              redirectTo: "/reset-password",
            });

            if (error) {
              toast.error("Couldn't send reset link", {
                description: error.message ?? "Please try again in a moment.",
              });
              return;
            }

            setSent(true);
            toast.success("Reset link sent", {
              description:
                "If an account exists for that email, reset instructions will arrive shortly.",
            });
          })}
          noValidate
          className="flex flex-col gap-4"
        >
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
            className="h-11 w-full text-[15px]"
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
