"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPaths } from "@/lib/app-paths";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { toast } from "@/lib/toast";
import { type LoginFormValues, loginSchema } from "@/schemas/login";

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your workspace to continue."
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          const res = await signIn("credentials", {
            email: values.email.trim().toLowerCase(),
            password: values.password,
            redirect: false,
          });

          if (res?.error) {
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

        <AuthField
          id="password"
          label="Password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
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
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
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
