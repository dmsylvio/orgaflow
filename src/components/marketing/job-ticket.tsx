"use client";

import { useState } from "react";

const STAGES = [
  {
    id: "estimate",
    label: "Estimate",
    doc: "Estimate",
    number: "EST-0142",
    stamp: null,
    caption: "You send the estimate as a secure link.",
  },
  {
    id: "approved",
    label: "Approved",
    doc: "Estimate",
    number: "EST-0142",
    stamp: "Approved",
    caption: "Your client approves it. No account needed.",
  },
  {
    id: "invoice",
    label: "Invoice",
    doc: "Invoice",
    number: "INV-0142",
    stamp: null,
    caption: "The approved estimate becomes an invoice in one click.",
  },
  {
    id: "paid",
    label: "Paid",
    doc: "Invoice",
    number: "INV-0142",
    stamp: "Paid",
    caption: "You record the payment and the invoice updates itself.",
  },
  {
    id: "work",
    label: "Work",
    doc: "Task",
    number: "Created automatically",
    stamp: null,
    caption: "An automation creates the task and assigns it.",
  },
] as const;

const LINES = [
  { item: "Exhaust hood cleaning", amount: "$680.00" },
  { item: "Filter replacement (4)", amount: "$180.00" },
];

export function JobTicket() {
  const [stageId, setStageId] =
    useState<(typeof STAGES)[number]["id"]>("approved");
  const stage = STAGES.find(({ id }) => id === stageId) ?? STAGES[1];

  return (
    <div className="w-full">
      <div className="relative mx-auto max-w-[29rem]">
        {/* The carbon copies underneath */}
        <div
          aria-hidden
          className="absolute inset-0 translate-x-3 translate-y-3 rotate-[1.5deg] bg-copy-pink"
        />
        <div
          aria-hidden
          className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[0.6deg] bg-white"
        />

        <div className="pad-sheet relative flex min-h-[24.5rem] flex-col bg-white px-6 pb-6 pt-8 text-foreground sm:px-8">
          <div className="flex items-baseline justify-between gap-4 border-b-2 border-primary pb-3 text-primary">
            <p className="text-2xl font-extrabold tracking-tight">
              {stage.doc}
            </p>
            <p className="text-sm font-semibold">{stage.number}</p>
          </div>

          {stage.id === "work" ? (
            <dl className="mt-5 flex-1 text-sm">
              {[
                ["Task", "Clean exhaust hood"],
                ["Customer", "Maple Street Bakery"],
                ["Assigned to", "Dana"],
                ["Due", "In 3 days"],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3"
                >
                  <dt className="text-muted-foreground">{term}</dt>
                  <dd className="text-right font-hand text-xl text-primary">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="relative flex flex-1 flex-col">
              <p className="mt-4 text-sm text-muted-foreground">Bill to</p>
              <p className="font-hand text-2xl leading-tight text-primary">
                Maple Street Bakery
              </p>
              <div className="mt-4 text-sm">
                {LINES.map(({ item, amount }) => (
                  <div
                    key={item}
                    className="flex items-baseline justify-between gap-4 border-b border-border py-2.5"
                  >
                    <span className="font-hand text-lg leading-tight text-primary">
                      {item}
                    </span>
                    <span className="font-hand text-lg text-primary">
                      {amount}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto flex items-baseline justify-between pt-5">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-3xl font-extrabold tracking-tight">
                  $860.00
                </span>
              </div>
              {stage.stamp ? (
                <p
                  key={stage.id}
                  className="stamp absolute bottom-[3.75rem] right-0 rounded border-[3px] border-primary px-3 py-1 text-2xl font-extrabold tracking-tight text-primary"
                >
                  {stage.stamp}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <fieldset className="mx-auto mt-9 max-w-[29rem] border-0 p-0">
        <legend className="sr-only">
          Follow a sample job through Orgaflow
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === stageId}
              onClick={() => setStageId(id)}
              className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                id === stageId
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-foreground/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p
          aria-live="polite"
          className="mt-3 min-h-[3rem] text-sm text-foreground"
        >
          {stage.caption}
        </p>
      </fieldset>
    </div>
  );
}
