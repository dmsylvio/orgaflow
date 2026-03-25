DO $$ BEGIN
  CREATE TYPE "public"."invoice_item_discount_type" AS ENUM('fixed', 'percentage');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'PENDING', 'SENT', 'VIEWED', 'PAID', 'OVERDUE', 'VOID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "customer_id" text NOT NULL,
  "currency_id" text NOT NULL,
  "sequence_number" integer NOT NULL,
  "invoice_date" date NOT NULL,
  "due_date" date,
  "invoice_number" text NOT NULL,
  "status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
  "tax_per_item" boolean DEFAULT false NOT NULL,
  "discount_per_item" boolean DEFAULT false NOT NULL,
  "discount_fixed" boolean DEFAULT false NOT NULL,
  "notes" text,
  "discount" numeric(13, 3),
  "discount_val" numeric(13, 3),
  "sub_total" numeric(13, 3) NOT NULL,
  "total" numeric(13, 3) NOT NULL,
  "tax" numeric(13, 3) NOT NULL,
  "exchange_rate" numeric(18, 6),
  "base_discount_val" numeric(13, 3),
  "base_sub_total" numeric(13, 3),
  "base_total" numeric(13, 3),
  "base_tax" numeric(13, 3),
  "sales_tax" numeric(8, 4),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "invoice_id" text NOT NULL,
  "item_id" text,
  "name" text NOT NULL,
  "description" text,
  "unit_name" text,
  "quantity" numeric(12, 4) NOT NULL,
  "price" numeric(13, 3) NOT NULL,
  "discount_type" "invoice_item_discount_type" DEFAULT 'fixed' NOT NULL,
  "discount" numeric(13, 3),
  "discount_val" numeric(13, 3),
  "tax" numeric(13, 3),
  "total" numeric(13, 3) NOT NULL,
  "exchange_rate" numeric(18, 6),
  "base_discount_val" numeric(13, 3),
  "base_price" numeric(13, 3),
  "base_tax" numeric(13, 3),
  "base_total" numeric(13, 3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "invoice_items"
    ADD CONSTRAINT "invoice_items_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk"
    FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invoice_items"
    ADD CONSTRAINT "invoice_items_item_id_items_id_fk"
    FOREIGN KEY ("item_id") REFERENCES "public"."items"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_customer_id_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_currency_id_currencies_id_fk"
    FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoice_items_org_idx" ON "invoice_items" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_items_item_idx" ON "invoice_items" USING btree ("item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_org_idx" ON "invoices" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_customer_idx" ON "invoices" USING btree ("customer_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_org_sequence_unique" ON "invoices" USING btree ("organization_id", "sequence_number");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_org_number_unique" ON "invoices" USING btree ("organization_id", "invoice_number");
