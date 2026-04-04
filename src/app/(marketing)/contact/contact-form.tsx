"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitContactForm,
  type ContactState,
} from "@/server/actions/contact";

const TOPICS = [
  "General inquiry",
  "Sales & pricing",
  "Technical support",
  "Billing",
  "Partnership",
  "Other",
];

const initialState: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, action, isPending] = useActionState(submitContactForm, initialState);
  const [startedAt, setStartedAt] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Record the time the form was rendered so the server can check timing
  useEffect(() => {
    setStartedAt(new Date().toISOString());
  }, []);

  // Reset form on success
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-12 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Message sent!</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          We read every message and will get back to you as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5">
      {/* Honeypot — hidden from humans, filled by bots */}
      <div aria-hidden className="hidden" style={{ display: "none" }}>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Timing token */}
      <input type="hidden" name="formStartedAt" value={startedAt} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="John"
            required
            maxLength={80}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Doe"
            required
            maxLength={80}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@company.com"
          required
          maxLength={254}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="topic">Topic</Label>
        <select
          id="topic"
          name="topic"
          required
          disabled={isPending}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
        >
          <option value="">Select a topic</option>
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us how we can help..."
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          className="resize-none"
          disabled={isPending}
        />
      </div>

      {state.status === "error" && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 shadow-md shadow-primary/20"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send message
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By sending this form you agree to our{" "}
        <a href="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
