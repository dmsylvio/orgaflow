import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page frame for the panel: title, optional description and
 * actions, then content. Keeps spacing and type consistent across modules.
 */
export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8",
        className,
      )}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="app-page-title">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const TONES = {
  slate:
    "bg-slate-100 text-slate-700 ring-slate-500/15 [--dot:theme(colors.slate.400)]",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15 [--dot:theme(colors.sky.500)]",
  violet:
    "bg-violet-50 text-violet-700 ring-violet-600/15 [--dot:theme(colors.violet.500)]",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 [--dot:theme(colors.emerald.500)]",
  amber:
    "bg-amber-50 text-amber-800 ring-amber-600/20 [--dot:theme(colors.amber.500)]",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20 [--dot:theme(colors.rose.500)]",
  zinc: "bg-zinc-100 text-zinc-600 ring-zinc-500/15 [--dot:theme(colors.zinc.400)]",
} as const;

export type StatusTone = keyof typeof TONES;

/** Pill with a colored dot, used for document and task statuses. */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--dot)]" />
      {children}
    </span>
  );
}
