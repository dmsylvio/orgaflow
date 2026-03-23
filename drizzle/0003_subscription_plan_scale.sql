-- Replace subscription_plan enum value `enterprise` with `scale` (product name: Scale).
CREATE TYPE "public"."subscription_plan_new" AS ENUM ('starter', 'growth', 'scale');
--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ALTER COLUMN "plan" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ALTER COLUMN "plan" TYPE "public"."subscription_plan_new" USING (
  CASE ("plan"::text)
    WHEN 'enterprise' THEN 'scale'::"public"."subscription_plan_new"
    WHEN 'starter' THEN 'starter'::"public"."subscription_plan_new"
    WHEN 'growth' THEN 'growth'::"public"."subscription_plan_new"
    ELSE 'starter'::"public"."subscription_plan_new"
  END
);
--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ALTER COLUMN "plan" SET DEFAULT 'starter'::"public"."subscription_plan_new";
--> statement-breakpoint
DROP TYPE "public"."subscription_plan";
--> statement-breakpoint
ALTER TYPE "public"."subscription_plan_new" RENAME TO "subscription_plan";
