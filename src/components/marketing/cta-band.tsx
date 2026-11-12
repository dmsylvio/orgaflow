import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";

export function PrimaryCta({
  href = "/register",
  children = "Start free",
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <NextLink
      href={href}
      className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%_100%] px-7 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)] transition-[background-position,transform,box-shadow] duration-500 hover:-translate-y-0.5 hover:bg-[position:100%_0] hover:shadow-[0_16px_40px_-12px_rgba(139,92,246,0.9)]"
    >
      {children}
      <ArrowRight
        aria-hidden
        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
      />
    </NextLink>
  );
}

export function CtaBand({
  title = "Send your first estimate today.",
  body = "The Starter plan is free forever. No credit card needed.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="on-dark relative mx-3 mb-5 mt-5 overflow-hidden rounded-[2rem] bg-ink text-white sm:mx-5">
      <div aria-hidden className="aurora absolute inset-0 opacity-80" />
      <div aria-hidden className="bg-grid absolute inset-0" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-20 sm:py-24 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="max-w-2xl text-balance text-4xl font-extrabold tracking-[-0.035em] sm:text-6xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-300">{body}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <PrimaryCta />
          <NextLink
            href="/contact"
            className="font-semibold text-white/85 underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            Talk to the founder
          </NextLink>
        </div>
      </div>
    </section>
  );
}
