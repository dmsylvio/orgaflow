CREATE TABLE "user_email_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_product_updates" boolean DEFAULT true NOT NULL,
	"email_tips" boolean DEFAULT true NOT NULL,
	"onboarding_d1_sent_at" timestamp with time zone,
	"onboarding_d3_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "organization_preferences" ADD COLUMN "invoice_template" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_preferences" ADD COLUMN "estimate_template" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "user_email_preferences" ADD CONSTRAINT "user_email_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;