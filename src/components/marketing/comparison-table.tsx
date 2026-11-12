import { Check, Minus } from "lucide-react";
import {
  type Cell,
  COMPARISON_CHECKED_ON,
  COMPARISON_ROWS,
  VENDOR_NAMES,
  type Vendor,
} from "@/lib/competitors";
import { cn } from "@/lib/utils";

function CellValue({ value, highlight }: { value: Cell; highlight: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full",
            highlight
              ? "bg-emerald-500 text-white"
              : "bg-emerald-50 text-emerald-600",
          )}
        >
          <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Minus aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <span className="sr-only">No</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "text-sm leading-snug",
        highlight ? "font-semibold text-foreground" : "text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

/**
 * Feature comparison table. Pass `vendors` to narrow it to a head-to-head.
 * Orgaflow's column is always first and highlighted.
 */
export function ComparisonTable({
  vendors = ["orgaflow", "freshbooks", "quickbooks", "jobber"],
  caption = "Orgaflow compared with FreshBooks, QuickBooks Online, and Jobber",
}: {
  vendors?: Vendor[];
  caption?: string;
}) {
  return (
    <div>
      <div className="relative -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="w-[32%] pb-4 pr-4 text-sm font-semibold text-muted-foreground"
              >
                Feature
              </th>
              {vendors.map((vendor) => {
                const us = vendor === "orgaflow";
                return (
                  <th
                    key={vendor}
                    scope="col"
                    className={cn(
                      "px-4 pb-4 pt-4 align-bottom text-sm font-bold",
                      us &&
                        "rounded-t-2xl bg-ink text-white shadow-[0_-20px_40px_-20px_rgba(99,102,241,0.6)]",
                    )}
                  >
                    {us ? (
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                        Best for client work
                      </span>
                    ) : null}
                    {VENDOR_NAMES[vendor]}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, rowIndex) => {
              const last = rowIndex === COMPARISON_ROWS.length - 1;
              return (
                <tr key={row.feature} className="group">
                  <th
                    scope="row"
                    className="border-t border-border py-4 pr-4 align-top text-sm font-semibold text-foreground"
                  >
                    {row.feature}
                    {row.hint ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {row.hint}
                      </span>
                    ) : null}
                  </th>
                  {vendors.map((vendor) => {
                    const us = vendor === "orgaflow";
                    return (
                      <td
                        key={vendor}
                        className={cn(
                          "border-t px-4 py-4 align-top transition-colors",
                          us
                            ? "border-white/10 bg-ink [&_.text-foreground]:text-white"
                            : "border-border group-hover:bg-muted/60",
                          us && last && "rounded-b-2xl",
                        )}
                      >
                        <CellValue value={row.values[vendor]} highlight={us} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Based on each vendor's public website and US list prices with monthly
        billing, checked in {COMPARISON_CHECKED_ON}. Competitor plans,
        promotions, and features change often, so confirm details on their
        sites. Product names are trademarks of their owners and are used for
        identification only.
      </p>
    </div>
  );
}
