ALTER TABLE "items"
  ALTER COLUMN "price" TYPE numeric(13, 3),
  ALTER COLUMN "price" SET DEFAULT '0.000';

ALTER TABLE "expenses"
  ALTER COLUMN "amount" TYPE numeric(13, 3);

ALTER TABLE "payments"
  ALTER COLUMN "amount" TYPE numeric(13, 3);

ALTER TABLE "estimates"
  ALTER COLUMN "discount" TYPE numeric(13, 3),
  ALTER COLUMN "discount_val" TYPE numeric(13, 3),
  ALTER COLUMN "sub_total" TYPE numeric(13, 3),
  ALTER COLUMN "total" TYPE numeric(13, 3),
  ALTER COLUMN "tax" TYPE numeric(13, 3),
  ALTER COLUMN "base_discount_val" TYPE numeric(13, 3),
  ALTER COLUMN "base_sub_total" TYPE numeric(13, 3),
  ALTER COLUMN "base_total" TYPE numeric(13, 3),
  ALTER COLUMN "base_tax" TYPE numeric(13, 3);

ALTER TABLE "estimate_items"
  ALTER COLUMN "price" TYPE numeric(13, 3),
  ALTER COLUMN "discount" TYPE numeric(13, 3),
  ALTER COLUMN "discount_val" TYPE numeric(13, 3),
  ALTER COLUMN "tax" TYPE numeric(13, 3),
  ALTER COLUMN "total" TYPE numeric(13, 3),
  ALTER COLUMN "base_discount_val" TYPE numeric(13, 3),
  ALTER COLUMN "base_price" TYPE numeric(13, 3),
  ALTER COLUMN "base_tax" TYPE numeric(13, 3),
  ALTER COLUMN "base_total" TYPE numeric(13, 3);
