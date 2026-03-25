ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "estimated_duration_minutes" integer;
