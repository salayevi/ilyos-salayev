ALTER TABLE "admins" ADD COLUMN "session_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reservation_key" text;--> statement-breakpoint
WITH "owners" AS (
	SELECT DISTINCT ON ("o"."product_id") "o"."id", "o"."product_id"
	FROM "orders" "o"
	INNER JOIN "products" "p" ON "p"."id" = "o"."product_id"
	WHERE "o"."kind" = 'product'
		AND (
			("p"."status" = 'reserved' AND "o"."status" IN ('new', 'contacted', 'scheduled'))
			OR ("p"."status" = 'sold' AND "o"."status" IN ('paid', 'done'))
		)
	ORDER BY "o"."product_id", "o"."created_at" DESC, "o"."id" DESC
)
UPDATE "orders" "o"
SET "reservation_key" = 'legacy-' || "o"."id"::text
FROM "owners"
WHERE "o"."id" = "owners"."id";--> statement-breakpoint
UPDATE "products" "p"
SET "reservation_key" = "o"."reservation_key"
FROM "orders" "o"
WHERE "o"."product_id" = "p"."id"
	AND "o"."reservation_key" IS NOT NULL;--> statement-breakpoint
UPDATE "products"
SET "status" = 'available', "reserved_until" = NULL
WHERE "status" = 'reserved' AND "reservation_key" IS NULL;--> statement-breakpoint
UPDATE "orders"
SET "status" = 'expired'
WHERE "kind" = 'product'
	AND "status" IN ('new', 'contacted', 'scheduled')
	AND "reservation_key" IS NULL;--> statement-breakpoint
UPDATE "orders"
SET "confirmation_expires_at" = "created_at" + interval '1 hour'
WHERE "customer_token_hash" <> '' AND "telegram_confirmed_at" IS NULL;--> statement-breakpoint
UPDATE "orders"
SET "customer_token_hash" = ''
WHERE "telegram_confirmed_at" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_reservation_key_idx" ON "orders" USING btree ("reservation_key");--> statement-breakpoint
CREATE INDEX "orders_product_status_idx" ON "orders" USING btree ("product_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "products_reservation_key_idx" ON "products" USING btree ("reservation_key");
