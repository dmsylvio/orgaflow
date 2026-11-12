import type { ReactNode } from "react";
import { Eyebrow } from "./section-heading";

export function PageHero({
  title,
  eyebrow,
  children,
  note,
}: {
  title: ReactNode;
  eyebrow?: string;
  children?: ReactNode;
  note?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="bg-grid-light absolute inset-0" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-300/40 via-violet-300/40 to-emerald-200/40 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-16 sm:pt-20">
        {eyebrow ? (
          <div className="pop-in">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
        ) : null}
        <h1
          className="pop-in mt-6 max-w-4xl text-balance text-[clamp(2.5rem,6vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-foreground"
          style={{ animationDelay: "60ms" }}
        >
          {title}
        </h1>
        {children ? (
          <p
            className="pop-in mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground"
            style={{ animationDelay: "120ms" }}
          >
            {children}
          </p>
        ) : null}
        {note ? (
          <p className="mt-4 text-sm text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </section>
  );
}
