-- Better Auth tables. Written to be idempotent: the app runs the same
-- statements at startup (src/server/db/auth-schema-sql.ts), so this
-- migration is safe whether or not that already happened.
CREATE TABLE IF NOT EXISTS "auth_accounts" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamp with time zone,
    "refresh_token_expires_at" timestamp with time zone,
    "scope" text,
    "password" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
  );
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "token" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "auth_sessions_token_unique" UNIQUE("token"),
    CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
  );
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_verifications" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_accounts_user_id_idx" ON "auth_accounts" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_verifications_identifier_idx" ON "auth_verifications" USING btree ("identifier");
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
--> statement-breakpoint
DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'users'
        AND column_name = 'email_verified'
        AND data_type <> 'boolean'
    ) THEN
      ALTER TABLE "users" ALTER COLUMN "email_verified" SET DATA TYPE boolean USING ("email_verified" IS NOT NULL);
    END IF;
  END $$;
--> statement-breakpoint
UPDATE "users" SET "email_verified" = false WHERE "email_verified" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET NOT NULL;
--> statement-breakpoint
INSERT INTO "auth_accounts" ("id", "user_id", "account_id", "provider_id", "password", "created_at", "updated_at")
   SELECT gen_random_uuid()::text, u."id", u."id", 'credential', u."password", now(), now()
   FROM "users" u
   WHERE u."password" IS NOT NULL
     AND u."password" <> ''
     AND NOT EXISTS (
       SELECT 1 FROM "auth_accounts" a
       WHERE a."user_id" = u."id" AND a."provider_id" = 'credential'
     );
