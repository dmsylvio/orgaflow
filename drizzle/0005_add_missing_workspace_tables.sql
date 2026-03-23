CREATE TYPE "public"."note_type" AS ENUM('invoice', 'estimate', 'payment');
--> statement-breakpoint
CREATE TYPE "public"."automation_assign_strategy" AS ENUM('document_owner', 'organization_owner');
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

CREATE TABLE "organization_notification_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "notify_email" text,
  "invoice_viewed" boolean DEFAULT false NOT NULL,
  "estimate_viewed" boolean DEFAULT false NOT NULL,
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

CREATE TABLE "payment_modes" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "task_stages" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "is_system" boolean DEFAULT false NOT NULL,
  "system_key" text,
  "created_by" text,
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

CREATE TABLE "expense_categories" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "notes" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "type" "public"."note_type" NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "automation_rules" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "is_enabled" boolean DEFAULT true NOT NULL,
  "trigger_document" text NOT NULL,
  "trigger_status" text NOT NULL,
  "task_stage_id" text,
  "task_title_template" text NOT NULL,
  "task_description_template" text,
  "assign_strategy" "public"."automation_assign_strategy" DEFAULT 'document_owner' NOT NULL,
  "assigned_user_id" text,
  "due_date_offset_days" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "organization_preferences" ADD CONSTRAINT "organization_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_preferences" ADD CONSTRAINT "organization_preferences_default_currency_id_currencies_id_fk" FOREIGN KEY ("default_currency_id") REFERENCES "public"."currencies"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_notification_settings" ADD CONSTRAINT "organization_notification_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_features" ADD CONSTRAINT "organization_features_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_modes" ADD CONSTRAINT "payment_modes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "task_stages" ADD CONSTRAINT "task_stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "task_stages" ADD CONSTRAINT "task_stages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tax_types" ADD CONSTRAINT "tax_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_task_stage_id_task_stages_id_fk" FOREIGN KEY ("task_stage_id") REFERENCES "public"."task_stages"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX "org_preferences_org_unique" ON "organization_preferences" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "org_notification_settings_org_unique" ON "organization_notification_settings" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "org_features_unique" ON "organization_features" USING btree ("organization_id","feature_key");
--> statement-breakpoint
CREATE INDEX "payment_modes_org_idx" ON "payment_modes" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "task_stages_org_idx" ON "task_stages" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "task_stages_org_position_unique" ON "task_stages" USING btree ("organization_id","position");
--> statement-breakpoint
CREATE INDEX "tax_types_org_idx" ON "tax_types" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "expense_categories_org_idx" ON "expense_categories" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "notes_org_idx" ON "notes" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "automation_rules_org_idx" ON "automation_rules" USING btree ("organization_id");
