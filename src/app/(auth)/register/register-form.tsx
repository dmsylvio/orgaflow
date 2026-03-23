"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPaths } from "@/lib/app-paths";
import { toast } from "@/lib/toast";
import { type RegisterFormValues, registerSchema } from "@/schemas/register";
import { registerAction } from "@/server/actions/auth";

export function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <AuthCard
      title="Create account"
      description="Register to start using Orgaflow with your organization."
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          const result = await registerAction(values);

          if (!result.success) {
            toast.error("Couldn't create account", {
              description: result.message,
            });
            return;
          }

          const signInRes = await signIn("credentials", {
            email: values.email.trim().toLowerCase(),
            password: values.password,
            redirect: false,
          });

          if (signInRes?.error) {
            toast.error("Account created", {
              description:
                "Your account was created, but automatic sign-in failed. Please log in manually.",
            });
            return;
          }

          router.push(appPaths.workspace);
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
            aria-describedby={errors.name ? "name-error" : undefined}
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
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
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
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            {...register("confirmPassword")}
          />
        </AuthField>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <NextLink
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </NextLink>
      </p>
    </AuthCard>
  );
}
