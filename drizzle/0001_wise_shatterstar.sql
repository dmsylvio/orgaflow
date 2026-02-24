ALTER TABLE "verification_request" RENAME TO "verification";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "provider_account_id" TO "account_id";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "access_token_expires" TO "access_token_expires_at";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "session_token" TO "token";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "expires" TO "expires_at";--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "token" TO "value";--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "expires" TO "expires_at";--> statement-breakpoint
DROP INDEX "session_access_token_unique";--> statement-breakpoint
DROP INDEX "verification_request_identifier_token_unique";--> statement-breakpoint
DROP INDEX "account_provider_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET DATA TYPE boolean USING (email_verified IS NOT NULL);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refresh_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "id_token" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "user_agent" text;--> statement-breakpoint
CREATE UNIQUE INDEX "verification_identifier_value_unique" ON "verification" USING btree ("identifier","value");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "provider_type";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "access_token";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "password";