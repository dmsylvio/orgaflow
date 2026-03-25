import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";
import { users } from "./users";

export const documentResourceTypeEnum = pgEnum("document_resource_type", [
  "expense",
  "estimate",
  "invoice",
]);

export const documentFiles = pgTable(
  "document_files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    resourceType: documentResourceTypeEnum("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    fileName: text("file_name").notNull(),
    storageKey: text("storage_key").notNull(), // Vercel Blob URL
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(), // bytes
    isPublic: boolean("is_public").notNull().default(false),
    uploadedById: text("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_files_org_idx").on(table.organizationId),
    index("document_files_resource_idx").on(
      table.resourceType,
      table.resourceId,
    ),
  ],
);

export const documentFilesRelations = relations(documentFiles, ({ one }) => ({
  organization: one(organizations, {
    fields: [documentFiles.organizationId],
    references: [organizations.id],
  }),
  uploadedBy: one(users, {
    fields: [documentFiles.uploadedById],
    references: [users.id],
  }),
}));
