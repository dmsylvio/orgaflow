import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/** Global currency catalog; FK from `estimates.currency_id` and optional `organizations.default_currency_id`. */
export const currencies = pgTable(
  "currencies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    code: text("code").notNull(),
    symbol: text("symbol").notNull(),
    precision: integer("precision").notNull().default(2),
    thousandSeparator: text("thousand_separator").notNull().default(","),
    decimalSeparator: text("decimal_separator").notNull().default("."),
    swapCurrencySymbol: boolean("swap_currency_symbol")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("currencies_code_unique").on(table.code)],
);
