ALTER TABLE "user"
ADD COLUMN "password" text;

UPDATE "user"
SET "password" = 'legacy-account-password';

ALTER TABLE "user"
ALTER COLUMN "password" SET NOT NULL;
