"use client";

import { Check } from "lucide-react";
import { useState } from "react";

const STAGES = [
  {
    id: "estimate",
    label: "Estimate",
    doc: "Estimate",
    number: "EST-0142",
    status: "Sent",
    done: false,
    caption: "You send the estimate as a secure link.",
  },
  {
    id: "approved",
    label: "Approved",
    doc: "Estimate",
    number: "EST-0142",
    status: "Approved",
    done: true,
    caption: "Your client approves it. No account needed.",
  },
  {
    id: "invoice",
    label: "Invoice",
    doc: "Invoice",
    number: "INV-0142",
    status: "Unpaid",
    done: false,
    caption: "The approved estimate becomes an invoice in one click.",
  },
  {
    id: "paid",
    label: "Paid",
    doc: "Invoice",
    number: "INV-0142",
    status: "Paid",
    done: true,
    caption: "You record the payment and the invoice updates itself.",
  },
  {
    id: "work",
    label: "Work",
    doc: "Task",
    number: "Created automatically",
    status: "To do",
    done: false,
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
    <div className="mx-auto w-full max-w-[29rem]">
      <div className="flex min-h-[21rem] flex-col rounded-3xl bg-white p-6 text-foreground shadow-[0_20px_50px_-20px_rgba(19,20,42,0.35)] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-lg font-bold tracking-tight">{stage.doc}</p>
            <p className="text-sm text-muted-foreground">{stage.number}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
              stage.done
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {stage.done ? <Check aria-hidden className="h-3.5 w-3.5" /> : null}
            {stage.status}
          </span>
        </div>

        {stage.id === "work" ? (
          <dl className="mt-2 flex-1 text-sm">
            {[
              ["Task", "Clean exhaust hood"],
              ["Customer", "Maple Street Bakery"],
              ["Assigned to", "Dana"],
              ["Due", "In 3 days"],
            ].map(([term, value]) => (
              <div
                key={term}
                className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0"
              >
                <dt className="text-muted-foreground">{term}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="flex flex-1 flex-col">
            <p className="mt-4 text-sm text-muted-foreground">Customer</p>
            <p className="font-semibold">Maple Street Bakery</p>
            <div className="mt-3 text-sm">
              {LINES.map(({ item, amount }) => (
                <div
                  key={item}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-2.5"
                >
                  <span>{item}</span>
                  <span className="font-medium">{amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto flex items-baseline justify-between pt-5">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-2xl font-extrabold tracking-tight">
                $860.00
              </span>
            </div>
          </div>
        )}
      </div>

      <fieldset className="mt-5 border-0 p-0">
        <legend className="sr-only">
          Follow a sample job through Orgaflow
        </legend>
        <div className="flex rounded-full bg-foreground/10 p-1">
          {STAGES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === stageId}
              onClick={() => setStageId(id)}
              className={`flex-1 rounded-full px-1 py-1.5 text-[13px] font-semibold transition-colors sm:text-sm ${
                id === stageId
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-foreground/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="mt-3 min-h-6 text-sm text-foreground">
          {stage.caption}
        </p>
      </fieldset>
    </div>
  );
}
