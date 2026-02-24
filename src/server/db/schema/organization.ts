import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const organization = pgTable(
  "organization",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("organization_slug_unique").on(table.slug)],
);
