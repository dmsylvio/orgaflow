"use client";

import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Receipt,
  Zap,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AutomationMock,
  BrowserFrame,
  DashboardMock,
  EstimatesMock,
  InvoiceMock,
  KanbanMock,
  ReportsMock,
  ScheduleMock,
} from "./product-mockups";

type Tab = {
  id: string;
  label: string;
  Icon: typeof Zap;
  title: string;
  body: string;
  plan: string;
  view: ReactNode;
};

const TABS: Tab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
    title: "See the whole business at a glance",
    body: "Revenue, open estimates, unpaid invoices, and what your team did today, all on one screen.",
    plan: "Every plan",
    view: <DashboardMock />,
  },
  {
    id: "estimates",
    label: "Estimates",
    Icon: FileText,
    title: "Estimates clients approve from a link",
    body: "Send a secure link. You see when it's viewed, and your client approves or declines without creating an account.",
    plan: "Every plan",
    view: <EstimatesMock />,
  },
  {
    id: "invoices",
    label: "Invoices",
    Icon: Receipt,
    title: "One click from approved to invoiced",
    body: "Convert the estimate with nothing to retype, record partial payments, pick a PDF template, or make it recurring.",
    plan: "Every plan · branding on Growth and Scale",
    view: <InvoiceMock />,
  },
  {
    id: "schedule",
    label: "Schedule",
    Icon: CalendarDays,
    title: "Plan visits and repeat them",
    body: "Put service visits on a calendar, set them to repeat, and bill for the work once it's done.",
    plan: "Every plan",
    view: <ScheduleMock />,
  },
  {
    id: "tasks",
    label: "Tasks",
    Icon: ClipboardList,
    title: "A board your whole team can work from",
    body: "Assign tasks, set due dates, and move work across the board. Automated tasks are tagged so you know where they came from.",
    plan: "Growth and Scale",
    view: <KanbanMock />,
  },
  {
    id: "automations",
    label: "Automations",
    Icon: Zap,
    title: "The work starts the moment the client says yes",
    body: "When an estimate is approved or an invoice is paid, Orgaflow creates the task with an assignee and a due date.",
    plan: "Scale",
    view: <AutomationMock />,
  },
  {
    id: "reports",
    label: "Reports",
    Icon: BarChart3,
    title: "Numbers that run a small business",
    body: "Invoiced vs. collected, estimate win rate, and how long it takes to get paid, without an accounting degree.",
    plan: "Advanced reports on Scale",
    view: <ReportsMock />,
  },
];

const AUTOPLAY_MS = 7000;

export function FeatureTour() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const running = inView && !paused;

  // `active` restarts the timer whenever the tab changes, including by click.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional restart
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setActive((i) => (i + 1) % TABS.length),
      AUTOPLAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [running, active]);

  const tab = TABS[active];

  return (
    <div
      ref={rootRef}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        role="tablist"
        aria-label="Orgaflow features"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
      >
        {TABS.map(({ id, label, Icon }, i) => {
          const selected = i === active;
          return (
            <button
              key={id}
              id={`tour-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`tour-panel-${id}`}
              onClick={() => setActive(i)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  const next =
                    (i + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) %
                    TABS.length;
                  setActive(next);
                  document.getElementById(`tour-tab-${TABS[next].id}`)?.focus();
                }
              }}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                selected
                  ? "border-white/20 bg-white text-ink"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {label}
              {selected && running ? (
                <span
                  key={`${id}-${active}`}
                  aria-hidden
                  className="progress-fill absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500"
                  style={
                    { "--duration": `${AUTOPLAY_MS}ms` } as React.CSSProperties
                  }
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        id={`tour-panel-${tab.id}`}
        role="tabpanel"
        aria-labelledby={`tour-tab-${tab.id}`}
        className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_1.9fr]"
      >
        <div key={`copy-${tab.id}`} className="pop-in">
          <p className="text-sm font-semibold text-emerald-300">{tab.plan}</p>
          <h3 className="mt-3 text-balance text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
            {tab.title}
          </h3>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            {tab.body}
          </p>
          <div className="mt-6 flex gap-1.5" aria-hidden>
            {TABS.map(({ id }, i) => (
              <span
                key={id}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === active ? "w-8 bg-white" : "w-1.5 bg-white/25",
                )}
              />
            ))}
          </div>
        </div>
        <div key={`view-${tab.id}`} className="pop-in min-w-0">
          <BrowserFrame>{tab.view}</BrowserFrame>
        </div>
      </div>
    </div>
  );
}
