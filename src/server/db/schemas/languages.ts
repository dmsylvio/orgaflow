import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/** Global language catalog; used for organization UI language preference. */
export const languages = pgTable(
  "languages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    code: text("code").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("languages_code_unique").on(table.code),
    uniqueIndex("languages_name_unique").on(table.name),
  ],
);
