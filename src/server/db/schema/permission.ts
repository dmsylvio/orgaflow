import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const permission = pgTable(
  "permission",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("permission_key_unique").on(table.key),
    uniqueIndex("permission_name_unique").on(table.name),
  ],
);
