"use client";

import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MagicLinkSent({
  email,
  onResend,
  onChangeEmail,
  resending,
}: {
  email: string;
  onResend: () => void;
  onChangeEmail: () => void;
  resending: boolean;
}) {
  return (
    <output
      aria-live="polite"
      className="flex flex-col items-center text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
        <MailCheck className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">
        Check your inbox
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We sent a sign-in link to{" "}
        <span className="font-semibold text-foreground">{email}</span>. It works
        once and expires in 15 minutes.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onResend}
          loading={resending}
          disabled={resending}
          className="w-full"
        >
          Resend link
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onChangeEmail}
          className="w-full"
        >
          Use a different email
        </Button>
      </div>
    </output>
  );
}
