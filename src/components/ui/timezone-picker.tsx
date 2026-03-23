"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Timezone list (via Intl API, falls back to UTC-only)
// ---------------------------------------------------------------------------

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC"];
  }
}

const ALL_TIMEZONES = getTimezones();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TimezonPickerProps {
  value: string;
  onValueChange: (tz: string) => void;
  id?: string;
  disabled?: boolean;
}

export function TimezonePicker({
  value,
  onValueChange,
  id,
  disabled,
}: TimezonPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_TIMEZONES;
    const q = search.toLowerCase();
    return ALL_TIMEZONES.filter((tz) => tz.toLowerCase().includes(q));
  }, [search]);

  function handleSelect(tz: string) {
    onValueChange(tz);
    setOpen(false);
    setSearch("");
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">{value || "Select a timezone"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <Command shouldFilter={false}>
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search timezone…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <Command.List className="max-h-60 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No timezone found.
                </Command.Empty>
              ) : (
                filtered.map((tz) => (
                  <Command.Item
                    key={tz}
                    value={tz}
                    onSelect={() => handleSelect(tz)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        tz === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {tz}
                  </Command.Item>
                ))
              )}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
