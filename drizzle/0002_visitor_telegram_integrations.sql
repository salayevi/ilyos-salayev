ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "telegram_confirmed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_token_hash" text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visits" integer DEFAULT 0 NOT NULL,
	"device" text DEFAULT 'unknown' NOT NULL,
	"browser" text DEFAULT 'unknown' NOT NULL,
	"os" text DEFAULT 'unknown' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "visitors_token_idx" ON "visitors" USING btree ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_last_seen_idx" ON "visitors" USING btree ("last_seen_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_id" integer NOT NULL,
	"type" text NOT NULL,
	"path" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" DROP CONSTRAINT IF EXISTS "analytics_events_visitor_id_visitors_id_fk";--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_created_idx" ON "analytics_events" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_type_idx" ON "analytics_events" USING btree ("type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_secrets" (
	"key" text PRIMARY KEY NOT NULL,
	"encrypted_value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
