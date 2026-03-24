ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "public_link_token" text;
--> statement-breakpoint
ALTER TABLE "invoices"
ADD COLUMN IF NOT EXISTS "public_link_created_at" timestamp with time zone;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_public_link_token_unique" ON "invoices" USING btree ("public_link_token");
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN IF NOT EXISTS "public_link_token" text;
--> statement-breakpoint
ALTER TABLE "estimates"
ADD COLUMN IF NOT EXISTS "public_link_created_at" timestamp with time zone;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "estimates_public_link_token_unique" ON "estimates" USING btree ("public_link_token");
