import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CalloutProps {
  variant?: "error" | "success" | "warning";
  children: ReactNode;
  className?: string;
}

const variantMap = {
  error: "error",
  success: "success",
  warning: "warning",
} as const;

export function Callout({
  variant = "error",
  children,
  className,
}: CalloutProps) {
  return (
    <Alert
      variant={variantMap[variant]}
      className={cn("py-2.5 text-sm", className)}
    >
      {children}
    </Alert>
  );
}
