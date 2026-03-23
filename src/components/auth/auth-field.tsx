import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface AuthFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function AuthField({ id, label, error, children }: AuthFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && errorId ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
