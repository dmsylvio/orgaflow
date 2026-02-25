DROP INDEX "invitation_org_email_unique";--> statement-breakpoint
CREATE INDEX "invitation_org_email_idx" ON "invitation" USING btree ("org_id","email");