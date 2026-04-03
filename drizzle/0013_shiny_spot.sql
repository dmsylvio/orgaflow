CREATE TYPE "public"."automation_assign_strategy" AS ENUM('document_owner', 'organization_owner');--> statement-breakpoint
CREATE TYPE "public"."document_resource_type" AS ENUM('expense', 'estimate', 'invoice');--> statement-breakpoint
CREATE TYPE "public"."invoice_item_discount_type" AS ENUM('fixed', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'PENDING', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('invoice', 'estimate', 'payment');--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"trigger_document" text NOT NULL,
	"trigger_status" text NOT NULL,
	"task_stage_id" text,
	"task_title_template" text NOT NULL,
	"task_description_template" text,
	"assign_strategy" "automation_assign_strategy" DEFAULT 'document_owner' NOT NULL,
	"assigned_user_id" text,
	"due_date_offset_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_files" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"resource_type" "document_resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"file_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"category_id" text,
	"customer_id" text,
	"payment_mode_id" text,
	"currency_id" text,
	"amount" numeric(13, 3) NOT NULL,
	"expense_date" date NOT NULL,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
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
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"currency_id" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date,
	"invoice_number" text NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"public_link_token" text,
	"public_link_created_at" timestamp with time zone,
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
CREATE TABLE "languages" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "note_type" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_notification_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"notify_email" text,
	"invoice_viewed" boolean DEFAULT false NOT NULL,
	"estimate_viewed" boolean DEFAULT false NOT NULL,
	"estimate_approved" boolean DEFAULT false NOT NULL,
	"estimate_rejected" boolean DEFAULT false NOT NULL,
	"invoice_overdue" boolean DEFAULT false NOT NULL,
	"payment_received" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_notification_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "organization_features" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"feature_key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"default_currency_id" text,
	"language" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"date_format" text DEFAULT 'DD/MM/YYYY' NOT NULL,
	"financial_year_start" text DEFAULT 'january-december' NOT NULL,
	"public_links_expire_enabled" boolean DEFAULT true NOT NULL,
	"public_links_expire_days" integer DEFAULT 7 NOT NULL,
	"discount_per_item" boolean DEFAULT false NOT NULL,
	"tax_per_item" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_preferences_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "payment_modes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"customer_id" text,
	"payment_mode_id" text,
	"currency_id" text,
	"amount" numeric(13, 3) NOT NULL,
	"payment_date" date NOT NULL,
	"invoice_id" text,
	"invoice_ref" text,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"system_key" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"stage_id" text,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"estimated_duration_minutes" integer,
	"due_date" timestamp with time zone,
	"owner_id" text,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_event" text,
	"source_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_types" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"percent" numeric(8, 3) NOT NULL,
	"compound_tax" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "countries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "countries" CASCADE;--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_country_id_countries_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_default_currency_id_currencies_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ALTER COLUMN "plan" SET DEFAULT 'starter'::text;--> statement-breakpoint
DROP TYPE "public"."subscription_plan";--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('starter', 'growth', 'scale');--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ALTER COLUMN "plan" SET DEFAULT 'starter'::"public"."subscription_plan";--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ALTER COLUMN "plan" SET DATA TYPE "public"."subscription_plan" USING "plan"::"public"."subscription_plan";--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "price" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "discount" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "discount_val" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "tax" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "total" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "base_discount_val" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "base_price" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "base_tax" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimate_items" ALTER COLUMN "base_total" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "discount" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "discount_val" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "sub_total" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "total" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "tax" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "base_discount_val" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "base_sub_total" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "base_total" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "estimates" ALTER COLUMN "base_tax" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "price" SET DATA TYPE numeric(13, 3);--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "price" SET DEFAULT '0.000';--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "public_link_token" text;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "public_link_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "address_line_1" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "address_line_2" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "business_phone" text;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_task_stage_id_task_stages_id_fk" FOREIGN KEY ("task_stage_id") REFERENCES "public"."task_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payment_mode_id_payment_modes_id_fk" FOREIGN KEY ("payment_mode_id") REFERENCES "public"."payment_modes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_notification_settings" ADD CONSTRAINT "organization_notification_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_features" ADD CONSTRAINT "organization_features_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_preferences" ADD CONSTRAINT "organization_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_preferences" ADD CONSTRAINT "organization_preferences_default_currency_id_currencies_id_fk" FOREIGN KEY ("default_currency_id") REFERENCES "public"."currencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_modes" ADD CONSTRAINT "payment_modes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_mode_id_payment_modes_id_fk" FOREIGN KEY ("payment_mode_id") REFERENCES "public"."payment_modes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_stages" ADD CONSTRAINT "task_stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_stages" ADD CONSTRAINT "task_stages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_stage_id_task_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."task_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_types" ADD CONSTRAINT "tax_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_rules_org_idx" ON "automation_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "document_files_org_idx" ON "document_files" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "document_files_resource_idx" ON "document_files" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "expense_categories_org_idx" ON "expense_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "expenses_org_idx" ON "expenses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expenses_customer_idx" ON "expenses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "invoice_items_org_idx" ON "invoice_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_items_item_idx" ON "invoice_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "invoices_org_idx" ON "invoices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_org_sequence_unique" ON "invoices" USING btree ("organization_id","sequence_number");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_org_number_unique" ON "invoices" USING btree ("organization_id","invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_public_link_token_unique" ON "invoices" USING btree ("public_link_token");--> statement-breakpoint
CREATE UNIQUE INDEX "languages_code_unique" ON "languages" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "languages_name_unique" ON "languages" USING btree ("name");--> statement-breakpoint
CREATE INDEX "notes_org_idx" ON "notes" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_notification_settings_org_unique" ON "organization_notification_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_features_unique" ON "organization_features" USING btree ("organization_id","feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "org_preferences_org_unique" ON "organization_preferences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_modes_org_idx" ON "payment_modes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payments_org_idx" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payments_customer_idx" ON "payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payments_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "payments_invoice_id_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_org_sequence_unique" ON "payments" USING btree ("organization_id","sequence_number");--> statement-breakpoint
CREATE INDEX "task_stages_org_idx" ON "task_stages" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_stages_org_position_unique" ON "task_stages" USING btree ("organization_id","position");--> statement-breakpoint
CREATE INDEX "tasks_org_idx" ON "tasks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tasks_stage_idx" ON "tasks" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "tax_types_org_idx" ON "tax_types" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "estimates_public_link_token_unique" ON "estimates" USING btree ("public_link_token");--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "country_id";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "default_currency_id";