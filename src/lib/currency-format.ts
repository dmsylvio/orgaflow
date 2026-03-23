export type CurrencyFormat = {
  id: string;
  code: string;
  symbol: string;
  precision: number;
  thousandSeparator: string;
  decimalSeparator: string;
  swapCurrencySymbol: boolean;
} | null;

/**
 * Persisted money columns support up to 3 decimals.
 * Keep UI/input aligned with storage while still respecting currencies
 * that use 0 or 2 decimal places.
 */
function getCurrencyPrecision(currency: CurrencyFormat): number {
  return Math.max(Math.min(currency?.precision ?? 2, 3), 0);
}

function addThousands(value: string, separator: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function normalizeRawValue(
  value: string | number,
  precision: number,
): { intPart: string; fractionPart: string } {
  const raw = String(value).trim();

  if (!raw) {
    return {
      intPart: "0",
      fractionPart: precision > 0 ? "0".repeat(precision) : "",
    };
  }

  const sanitized = raw.replace(/,/g, ".");
  const [rawInt = "0", rawFraction = ""] = sanitized.split(".");
  const intPart = (rawInt.replace(/\D/g, "") || "0").replace(/^0+(?=\d)/, "");
  const fractionPart =
    precision > 0
      ? rawFraction
          .replace(/\D/g, "")
          .padEnd(precision, "0")
          .slice(0, precision)
      : "";

  return {
    intPart: intPart.length > 0 ? intPart : "0",
    fractionPart,
  };
}

function digitsToNormalizedValue(digits: string, precision: number): string {
  const sanitized = digits.replace(/\D/g, "");

  if (!sanitized) return "";

  if (precision === 0) {
    const intPart = sanitized.replace(/^0+(?=\d)/, "");
    return intPart.length > 0 ? intPart : "0";
  }

  const padded = sanitized.padStart(precision + 1, "0");
  const intPart = padded.slice(0, -precision).replace(/^0+(?=\d)/, "") || "0";
  const fractionPart = padded.slice(-precision);

  return `${intPart}.${fractionPart}`;
}

export function parseCurrencyInput(
  value: string,
  currency: CurrencyFormat,
): string {
  return digitsToNormalizedValue(value, getCurrencyPrecision(currency));
}

export function formatCurrencyNumber(
  value: string | number,
  currency: CurrencyFormat,
): string {
  if (value === "") return "";

  const precision = getCurrencyPrecision(currency);
  const thousandSeparator = currency?.thousandSeparator ?? ",";
  const decimalSeparator = currency?.decimalSeparator ?? ".";
  const { intPart, fractionPart } = normalizeRawValue(value, precision);
  const formattedInt = addThousands(intPart, thousandSeparator);

  if (precision === 0) return formattedInt;

  return `${formattedInt}${decimalSeparator}${fractionPart}`;
}

export function formatCurrencyDisplay(
  value: string | number,
  currency: CurrencyFormat,
): string {
  const formattedNumber = formatCurrencyNumber(value, currency);

  if (!formattedNumber) return "";
  if (!currency?.symbol) return formattedNumber;

  return currency.swapCurrencySymbol
    ? `${formattedNumber} ${currency.symbol}`.trim()
    : `${currency.symbol}${formattedNumber}`;
}

export function getCurrencyInputPlaceholder(currency: CurrencyFormat): string {
  const precision = getCurrencyPrecision(currency);
  const decimalSeparator = currency?.decimalSeparator ?? ".";

  if (precision === 0) return "0";

  return `0${decimalSeparator}${"0".repeat(precision)}`;
}
