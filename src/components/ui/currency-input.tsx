"use client";

import { Input, type InputProps } from "@/components/ui/input";
import {
  type CurrencyFormat,
  formatCurrencyNumber,
  getCurrencyInputPlaceholder,
  parseCurrencyInput,
} from "@/lib/currency-format";
import { cn } from "@/lib/utils";

type CurrencyInputProps = Omit<
  InputProps,
  "type" | "value" | "onChange" | "inputMode"
> & {
  currency: CurrencyFormat;
  value: string;
  onValueChange: (value: string) => void;
};

export function CurrencyInput({
  currency,
  value,
  onValueChange,
  className,
  placeholder,
  ...props
}: CurrencyInputProps) {
  const hasLeadingSymbol = Boolean(
    currency?.symbol && !currency.swapCurrencySymbol,
  );
  const hasTrailingSymbol = Boolean(
    currency?.symbol && currency.swapCurrencySymbol,
  );

  return (
    <div className="relative">
      {hasLeadingSymbol ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
          {currency?.symbol}
        </span>
      ) : null}

      <Input
        {...props}
        type="text"
        inputMode="numeric"
        value={value ? formatCurrencyNumber(value, currency) : ""}
        onChange={(event) =>
          onValueChange(parseCurrencyInput(event.target.value, currency))
        }
        placeholder={placeholder ?? getCurrencyInputPlaceholder(currency)}
        className={cn(
          hasLeadingSymbol && "pl-12",
          hasTrailingSymbol && "pr-14",
          className,
        )}
      />

      {hasTrailingSymbol ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
          {currency?.symbol}
        </span>
      ) : null}
    </div>
  );
}
