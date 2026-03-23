"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";

// ---------------------------------------------------------------------------
// Layout helpers (local — same pattern as other settings pages)
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
      <h2 className="mb-1 text-sm font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mb-4 text-xs text-muted-foreground">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        {children}
      </div>
    </section>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const DEFAULT_NOTIFICATION_EMAIL = "noreply@orgaflow.app";

export default function NotificationsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery(
    trpc.settings.getNotificationSettings.queryOptions(),
  );

  const [notifyEmail, setNotifyEmail] = useState("");
  const [invoiceViewed, setInvoiceViewed] = useState(false);
  const [estimateViewed, setEstimateViewed] = useState(false);

  useEffect(() => {
    if (!data) return;
    setNotifyEmail(data.notifyEmail ?? DEFAULT_NOTIFICATION_EMAIL);
    setInvoiceViewed(data.invoiceViewed ?? false);
    setEstimateViewed(data.estimateViewed ?? false);
  }, [data]);

  const update = useMutation(
    trpc.settings.updateNotificationSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.settings.getNotificationSettings.queryOptions(),
        );
        toast.success("Notification settings saved.");
      },
      onError: (e) =>
        toast.error("Couldn't save notification settings", {
          description: e.message,
        }),
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      notifyEmail: notifyEmail.trim() || null,
      invoiceViewed,
      estimateViewed,
    });
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
      title="Notifications"
      description="Choose which email notifications you'd like to receive when something changes."
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Destination */}
        <Section
          title="Send notifications to"
          description="Leave blank to use the default notifications address."
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notif-email">Email address</Label>
            <Input
              id="notif-email"
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder={DEFAULT_NOTIFICATION_EMAIL}
            />
          </div>
        </Section>

        {/* Document interactions */}
        <Section
          title="Document interactions"
          description="Get notified when your customers interact with shared documents."
        >
          <SwitchRow
            id="notif-invoice-viewed"
            label="Invoice viewed"
            description="When your customer opens an invoice shared via a public link."
            checked={invoiceViewed}
            onCheckedChange={setInvoiceViewed}
          />
          <Separator />
          <SwitchRow
            id="notif-estimate-viewed"
            label="Estimate viewed"
            description="When your customer opens an estimate shared via a public link."
            checked={estimateViewed}
            onCheckedChange={setEstimateViewed}
          />
        </Section>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={update.isPending}
            disabled={update.isPending}
          >
            Save settings
          </Button>
        </div>
      </form>
    </SettingsPage>
  );
}
