-- Add PARTIALLY_PAID to invoice_status enum (used by payments to set invoice state).

DO $$ BEGIN
  ALTER TYPE "invoice_status" ADD VALUE 'PARTIALLY_PAID';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
