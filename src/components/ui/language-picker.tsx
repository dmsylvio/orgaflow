"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface LanguageOption {
  code: string;
  name: string;
}

interface LanguagePickerProps {
  languages: LanguageOption[];
  value: string;
  onValueChange: (code: string) => void;
  id?: string;
  disabled?: boolean;
}

export function LanguagePicker({
  languages,
  value,
  onValueChange,
  id,
  disabled,
}: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = languages.find((l) => l.code === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return languages;
    const q = search.toLowerCase();
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [languages, search]);

  function handleSelect(code: string) {
    onValueChange(code);
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
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selected ? (
              <>
                {selected.name}
                <span className="ml-1.5 text-muted-foreground">
                  {selected.code}
                </span>
              </>
            ) : (
              "Select a language"
            )}
          </span>
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
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search language…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-60 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No language found.
                </Command.Empty>
              ) : (
                filtered.map((l) => (
                  <Command.Item
                    key={l.code}
                    value={l.code}
                    onSelect={() => handleSelect(l.code)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        l.code === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1 truncate">{l.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {l.code}
                    </span>
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
