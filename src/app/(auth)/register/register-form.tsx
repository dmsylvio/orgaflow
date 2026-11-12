"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthAlternative } from "@/components/auth/auth-alternative";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPaths } from "@/lib/app-paths";
import { authClient } from "@/lib/auth-client";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { toast } from "@/lib/toast";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  return (
    <AuthCard
      title="Create account"
      description="Start free. No credit card needed."
    >
      <form
        onSubmit={handleSubmit(async (values) => {
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
        <AuthField id="name" label="Full name" error={errors.name?.message}>
          <Input
            id="name"
            type="text"
            autoComplete="name"
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

        <AuthField
          id="password"
          label="Password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
        </AuthField>

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={errors.confirmPassword ? true : undefined}
            {...register("confirmPassword")}
          />
        </AuthField>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="h-11 w-full text-[15px]"
          size="lg"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <AuthAlternative
        href={`/register/magic-link${nextQuery}`}
        label="Sign up with an email link"
        Icon={Mail}
      />

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
