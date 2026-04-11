ALTER TABLE "organization_preferences"
  ADD COLUMN "invoice_template" integer NOT NULL DEFAULT 1,
  ADD COLUMN "estimate_template" integer NOT NULL DEFAULT 1;
