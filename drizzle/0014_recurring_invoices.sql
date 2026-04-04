CREATE TYPE "public"."recurring_frequency" AS ENUM(
  'every_hour',
  'every_2_hours',
  'every_day',
  'every_week',
  'every_15_days',
  'every_month',
  'every_6_months',
  'every_year'
);--> statement-breakpoint

CREATE TYPE "public"."recurring_limit_type" AS ENUM('none', 'date', 'count');--> statement-breakpoint

CREATE TYPE "public"."recurring_status" AS ENUM('active', 'on_hold', 'completed');--> statement-breakpoint

CREATE TABLE "recurring_invoice_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "customer_id" text NOT NULL,
  "currency_id" text NOT NULL,
  "name" text NOT NULL,
  "frequency" "recurring_frequency" NOT NULL,
  "start_date" date NOT NULL,
  "next_run_at" timestamp with time zone NOT NULL,
  "limit_type" "recurring_limit_type" NOT NULL DEFAULT 'none',
  "limit_date" date,
  "limit_count" integer,
  "generated_count" integer NOT NULL DEFAULT 0,
  "status" "recurring_status" NOT NULL DEFAULT 'active',
  "send_automatically" boolean NOT NULL DEFAULT false,
  "due_days_offset" integer,
  "notes" text,
  "discount" numeric(13, 3),
  "discount_fixed" boolean NOT NULL DEFAULT false,
  "sub_total" numeric(13, 3) NOT NULL DEFAULT '0.000',
  "total" numeric(13, 3) NOT NULL DEFAULT '0.000',
  "tax" numeric(13, 3) NOT NULL DEFAULT '0.000',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "recurring_invoice_template_items" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "template_id" text NOT NULL,
  "item_id" text,
  "name" text NOT NULL,
  "description" text,
  "unit_name" text,
  "quantity" numeric(12, 4) NOT NULL,
  "price" numeric(13, 3) NOT NULL,
  "total" numeric(13, 3) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "invoices" ADD COLUMN "recurring_template_id" text;--> statement-breakpoint

ALTER TABLE "recurring_invoice_templates"
  ADD CONSTRAINT "recurring_invoice_templates_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "recurring_invoice_templates"
  ADD CONSTRAINT "recurring_invoice_templates_customer_id_customers_id_fk"
  FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "recurring_invoice_templates"
  ADD CONSTRAINT "recurring_invoice_templates_currency_id_currencies_id_fk"
  FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "recurring_invoice_template_items"
  ADD CONSTRAINT "recurring_invoice_template_items_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "recurring_invoice_template_items"
  ADD CONSTRAINT "recurring_invoice_template_items_template_id_fk"
  FOREIGN KEY ("template_id") REFERENCES "public"."recurring_invoice_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "recurring_invoice_template_items"
  ADD CONSTRAINT "recurring_invoice_template_items_item_id_fk"
  FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_recurring_template_id_fk"
  FOREIGN KEY ("recurring_template_id") REFERENCES "public"."recurring_invoice_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "ri_templates_org_idx" ON "recurring_invoice_templates" ("organization_id");--> statement-breakpoint
CREATE INDEX "ri_templates_customer_idx" ON "recurring_invoice_templates" ("customer_id");--> statement-breakpoint
CREATE INDEX "ri_templates_next_run_idx" ON "recurring_invoice_templates" ("next_run_at");--> statement-breakpoint
CREATE INDEX "ri_template_items_org_idx" ON "recurring_invoice_template_items" ("organization_id");--> statement-breakpoint
CREATE INDEX "ri_template_items_template_idx" ON "recurring_invoice_template_items" ("template_id");--> statement-breakpoint
CREATE INDEX "invoices_recurring_template_idx" ON "invoices" ("recurring_template_id");
