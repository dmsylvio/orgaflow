"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import {
  type ResetPasswordFormValues,
  resetPasswordSchema,
} from "@/schemas/reset-password";
import { resetPasswordAction } from "@/server/actions/auth";

interface ResetPasswordFormProps {
  initialToken: string;
}

export function ResetPasswordForm({ initialToken }: ResetPasswordFormProps) {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: initialToken,
      password: "",
      confirmPassword: "",
    },
  });

  const tokenValue = watch("token");
  const tokenMissing = !tokenValue?.trim();

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a strong password you have not used elsewhere."
    >
      <input type="hidden" {...register("token")} />

      {tokenMissing ? (
        <Callout variant="error" className="mb-4">
          <span role="alert">
            This reset link is missing a token. Open the link from your email or
            request a new reset.
          </span>
        </Callout>
      ) : null}

      <form
        onSubmit={handleSubmit(async (values) => {
          setRootError(null);
          const result = await resetPasswordAction(values);

          if (!result.success) {
            if (result.fieldErrors) {
              for (const [key, message] of Object.entries(result.fieldErrors)) {
                if (
                  key === "token" ||
                  key === "password" ||
                  key === "confirmPassword"
                ) {
                  setError(key as keyof ResetPasswordFormValues, { message });
                }
              }
            }
            setRootError(result.message);
            return;
          }

          router.push("/login");
          router.refresh();
        })}
        noValidate
      >
        <div className="flex flex-col gap-4">
          {rootError ? (
            <Callout variant="error">
              <span role="alert">{rootError}</span>
            </Callout>
          ) : null}

          <AuthField
            id="password"
            label="New password"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={tokenMissing}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
          </AuthField>

          <AuthField
            id="confirmPassword"
            label="Confirm new password"
            error={errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={tokenMissing}
              aria-invalid={errors.confirmPassword ? true : undefined}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              {...register("confirmPassword")}
            />
          </AuthField>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting || tokenMissing}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>

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
