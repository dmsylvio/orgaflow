-- Create expenses table (may already exist on dev DBs that used drizzle-kit push)
CREATE TABLE IF NOT EXISTS "expenses" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "category_id" text,
  "payment_mode_id" text,
  "currency_id" text,
  "amount" numeric(12, 2) NOT NULL,
  "expense_date" date NOT NULL,
  "description" text,
  "notes" text,
  "reference_number" text,
  "created_by_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create payments table (may already exist on dev DBs that used drizzle-kit push)
CREATE TABLE IF NOT EXISTS "payments" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "sequence_number" integer NOT NULL,
  "payment_number" text NOT NULL,
  "customer_id" text,
  "payment_mode_id" text,
  "currency_id" text,
  "amount" numeric(12, 2) NOT NULL,
  "payment_date" date NOT NULL,
  "invoice_ref" text,
  "notes" text,
  "created_by_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "expenses_org_idx" ON "expenses" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses" USING btree ("expense_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_org_idx" ON "payments" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_customer_idx" ON "payments" USING btree ("customer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_date_idx" ON "payments" USING btree ("payment_date");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_org_sequence_unique" ON "payments" USING btree ("organization_id", "sequence_number");
--> statement-breakpoint

-- Expand numeric precision for monetary columns
ALTER TABLE "items"
  ALTER COLUMN "price" TYPE numeric(13, 3),
  ALTER COLUMN "price" SET DEFAULT '0.000';

ALTER TABLE "expenses"
  ALTER COLUMN "amount" TYPE numeric(13, 3);

ALTER TABLE "payments"
  ALTER COLUMN "amount" TYPE numeric(13, 3);

ALTER TABLE "estimates"
  ALTER COLUMN "discount" TYPE numeric(13, 3),
  ALTER COLUMN "discount_val" TYPE numeric(13, 3),
  ALTER COLUMN "sub_total" TYPE numeric(13, 3),
  ALTER COLUMN "total" TYPE numeric(13, 3),
  ALTER COLUMN "tax" TYPE numeric(13, 3),
  ALTER COLUMN "base_discount_val" TYPE numeric(13, 3),
  ALTER COLUMN "base_sub_total" TYPE numeric(13, 3),
  ALTER COLUMN "base_total" TYPE numeric(13, 3),
  ALTER COLUMN "base_tax" TYPE numeric(13, 3);

ALTER TABLE "estimate_items"
  ALTER COLUMN "price" TYPE numeric(13, 3),
  ALTER COLUMN "discount" TYPE numeric(13, 3),
  ALTER COLUMN "discount_val" TYPE numeric(13, 3),
  ALTER COLUMN "tax" TYPE numeric(13, 3),
  ALTER COLUMN "total" TYPE numeric(13, 3),
  ALTER COLUMN "base_discount_val" TYPE numeric(13, 3),
  ALTER COLUMN "base_price" TYPE numeric(13, 3),
  ALTER COLUMN "base_tax" TYPE numeric(13, 3),
  ALTER COLUMN "base_total" TYPE numeric(13, 3);
