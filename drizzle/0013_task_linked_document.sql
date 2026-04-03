-- Add linkedDocumentType to tasks and attachDocument to automation_rules.

ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "linked_document_type" text;

ALTER TABLE "automation_rules"
  ADD COLUMN IF NOT EXISTS "attach_document" boolean NOT NULL DEFAULT true;
