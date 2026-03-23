ALTER TABLE "organizations" ADD COLUMN "address_line_1" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "address_line_2" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "country_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "business_email" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "business_phone" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;
