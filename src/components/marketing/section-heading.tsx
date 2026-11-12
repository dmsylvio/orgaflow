import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  dark = false,
  className,
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
        dark
          ? "border-white/15 bg-white/5 text-indigo-200"
          : "border-primary/20 bg-accent text-accent-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          dark ? "bg-emerald-400" : "bg-primary",
        )}
      />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
  dark = false,
  align = "left",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  dark?: boolean;
  align?: "left" | "center";
  as?: "h1" | "h2";
}) {
  const centered = align === "center";
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
      {eyebrow ? <Eyebrow dark={dark}>{eyebrow}</Eyebrow> : null}
      <Tag
        className={cn(
          "mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </Tag>
      {children ? (
        <p
          className={cn(
            "mt-5 text-pretty text-lg leading-relaxed",
            centered && "mx-auto max-w-2xl",
            dark ? "text-slate-300" : "text-muted-foreground",
          )}
        >
          {children}
        </p>
      ) : null}
    </div>
  );
}
