CREATE TABLE "languages" (
  "id" text PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "languages_code_unique" ON "languages" USING btree ("code");
--> statement-breakpoint
CREATE UNIQUE INDEX "languages_name_unique" ON "languages" USING btree ("name");
