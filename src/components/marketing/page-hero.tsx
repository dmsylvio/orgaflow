import type { ReactNode } from "react";

export function PageHero({
  title,
  children,
  note,
}: {
  title: string;
  children?: ReactNode;
  note?: ReactNode;
}) {
  return (
    <section className="border-b-2 border-foreground">
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pt-20">
        <h1 className="max-w-4xl text-balance text-[clamp(2.5rem,6vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-foreground">
          {title}
        </h1>
        {children ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
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
