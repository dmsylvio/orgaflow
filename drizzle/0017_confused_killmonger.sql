CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."schedule_billing_mode" AS ENUM('none', 'per_appointment', 'consolidated');--> statement-breakpoint
CREATE TYPE "public"."schedule_billing_period" AS ENUM('weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."schedule_billing_trigger" AS ENUM('manual', 'on_schedule', 'on_completion', 'period_end');--> statement-breakpoint
CREATE TYPE "public"."schedule_frequency" AS ENUM('daily', 'weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."schedule_series_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"series_id" text,
	"customer_id" text,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"all_day" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"assigned_user_id" text,
	"detached_from_series" boolean DEFAULT false NOT NULL,
	"billing_mode" "schedule_billing_mode" DEFAULT 'none' NOT NULL,
	"billing_trigger" "schedule_billing_trigger" DEFAULT 'on_completion' NOT NULL,
	"item_id" text,
	"currency_id" text,
	"item_name" text,
	"quantity" numeric(13, 3) DEFAULT '1.000' NOT NULL,
	"unit_price" numeric(13, 3) DEFAULT '0.000' NOT NULL,
	"total" numeric(13, 3) DEFAULT '0.000' NOT NULL,
	"invoice_id" text,
	"invoiced_at" timestamp with time zone,
	"billing_blocked_reason" text,
	"billing_blocked_at" timestamp with time zone,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_series" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" text,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"frequency" "schedule_frequency" NOT NULL,
	"weekdays" integer[],
	"month_day" integer,
	"start_time" text,
	"end_time" text,
	"all_day" boolean DEFAULT false NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"max_occurrences" integer,
	"generated_count" integer DEFAULT 0 NOT NULL,
	"materialized_until" timestamp with time zone,
	"status" "schedule_series_status" DEFAULT 'active' NOT NULL,
	"assigned_user_id" text,
	"billing_mode" "schedule_billing_mode" DEFAULT 'none' NOT NULL,
	"billing_trigger" "schedule_billing_trigger" DEFAULT 'on_completion' NOT NULL,
	"billing_period" "schedule_billing_period",
	"item_id" text,
	"currency_id" text,
	"quantity" numeric(13, 3) DEFAULT '1.000' NOT NULL,
	"unit_price" numeric(13, 3) DEFAULT '0.000' NOT NULL,
	"due_days_offset" integer,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_series_id_schedule_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."schedule_series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_series" ADD CONSTRAINT "schedule_series_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_series" ADD CONSTRAINT "schedule_series_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_series" ADD CONSTRAINT "schedule_series_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_series" ADD CONSTRAINT "schedule_series_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_series" ADD CONSTRAINT "schedule_series_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_series" ADD CONSTRAINT "schedule_series_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_org_idx" ON "appointments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "appointments_starts_at_idx" ON "appointments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "appointments_org_range_idx" ON "appointments" USING btree ("organization_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointments_series_idx" ON "appointments" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "appointments_customer_idx" ON "appointments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "appointments_invoice_idx" ON "appointments" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_series_slot_unique" ON "appointments" USING btree ("series_id","starts_at");--> statement-breakpoint
CREATE INDEX "schedule_series_org_idx" ON "schedule_series" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "schedule_series_customer_idx" ON "schedule_series" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "schedule_series_status_idx" ON "schedule_series" USING btree ("status");--> statement-breakpoint
CREATE INDEX "schedule_series_materialized_idx" ON "schedule_series" USING btree ("materialized_until");