-- Sync all manual DB changes made outside the migration system.
-- Safe to run on existing dev DBs (uses IF EXISTS / IF NOT EXISTS throughout).

-- 1. task_stages: add color column
ALTER TABLE "task_stages" ADD COLUMN IF NOT EXISTS "color" text;
--> statement-breakpoint

-- 2. expenses: add customer_id FK
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "customer_id" text
  REFERENCES "public"."customers"("id") ON DELETE SET NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "expenses_customer_idx" ON "expenses" USING btree ("customer_id");
--> statement-breakpoint

-- 3. expenses: drop obsolete columns (description, reference_number)
ALTER TABLE "expenses" DROP COLUMN IF EXISTS "description";
--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN IF EXISTS "reference_number";
--> statement-breakpoint

-- 4. payments: drop payment_number (derived from sequence_number in application layer)
DROP INDEX IF EXISTS "payments_org_number_unique";
--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN IF EXISTS "payment_number";
