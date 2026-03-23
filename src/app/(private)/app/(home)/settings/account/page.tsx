"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="mb-8" />
      <div className="space-y-8">{children}</div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccountSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: me, isPending } = useQuery(trpc.account.me.queryOptions());

  // Profile form state
  const [name, setName] = useState("");
  useEffect(() => {
    if (me?.name) setName(me.name);
  }, [me?.name]);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const updateProfile = useMutation(
    trpc.account.updateProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.account.me.queryOptions());
        toast.success("Profile updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update profile", { description: e.message }),
    }),
  );

  const updatePassword = useMutation(
    trpc.account.updatePassword.mutationOptions({
      onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPwError(null);
        toast.success("Password changed.");
      },
      onError: (e) => {
        setPwError(e.message);
      },
    }),
  );

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate({ name: name.trim() });
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    updatePassword.mutate({ currentPassword, newPassword, confirmPassword });
  }

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  return (
    <SettingsPage
      title="Account Settings"
      description="Manage your personal profile and password."
    >
      {/* Profile */}
      <Section
        title="Profile"
        description="Your display name shown across the app."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Field label="Full name" htmlFor="acc-name">
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </Field>
          <Field
            label="Email"
            htmlFor="acc-email"
            hint="Email changes are not supported at this time."
          >
            <Input
              id="acc-email"
              value={me?.email ?? ""}
              readOnly
              disabled
              className="cursor-not-allowed opacity-60"
            />
          </Field>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              loading={updateProfile.isPending}
              disabled={updateProfile.isPending || !name.trim()}
            >
              Save profile
            </Button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section
        title="Password"
        description="Use a strong password of at least 8 characters."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwError ? (
            <Alert variant="error" className="text-sm">
              {pwError}
            </Alert>
          ) : null}
          <Field label="Current password" htmlFor="pw-current">
            <Input
              id="pw-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>
          <Field label="New password" htmlFor="pw-new">
            <Input
              id="pw-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-confirm">
            <Input
              id="pw-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </Field>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              loading={updatePassword.isPending}
              disabled={
                updatePassword.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              Change password
            </Button>
          </div>
        </form>
      </Section>

      {/* Avatar placeholder */}
      <Section
        title="Avatar"
        description="Visual identity shown next to your name."
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary",
            )}
          >
            {me?.name?.trim()?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{me?.name}</p>
            <p className="text-xs text-muted-foreground">{me?.email}</p>
          </div>
        </div>
      </Section>
    </SettingsPage>
  );
}
