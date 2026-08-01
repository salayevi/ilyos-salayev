CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"mime" text DEFAULT 'image/jpeg' NOT NULL,
	"bytes" "bytea" NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"price_note" text DEFAULT '' NOT NULL,
	"demo_url" text DEFAULT '' NOT NULL,
	"source_kind" text DEFAULT 'manual' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"preview_image" text DEFAULT '' NOT NULL,
	"stack" text DEFAULT '[]' NOT NULL,
	"includes" text DEFAULT '[]' NOT NULL,
	"category" text DEFAULT 'Biznes' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "kind" text DEFAULT 'service' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "live_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;