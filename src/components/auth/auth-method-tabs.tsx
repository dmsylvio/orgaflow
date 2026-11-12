"use client";

import { KeyRound, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthMethod = "magic-link" | "password";

const METHODS: { id: AuthMethod; label: string; Icon: typeof Mail }[] = [
  { id: "magic-link", label: "Email link", Icon: Mail },
  { id: "password", label: "Password", Icon: KeyRound },
];

export function AuthMethodTabs({
  value,
  onChange,
}: {
  value: AuthMethod;
  onChange: (method: AuthMethod) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sign-in method"
      className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/60 p-1"
    >
      {METHODS.map(({ id, label, Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
