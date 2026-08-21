CREATE TABLE "estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"service_slug" text NOT NULL,
	"selections" text DEFAULT '{}' NOT NULL,
	"breakdown" text DEFAULT '[]' NOT NULL,
	"idea" text DEFAULT '' NOT NULL,
	"one_time" integer DEFAULT 0 NOT NULL,
	"monthly" integer DEFAULT 0 NOT NULL,
	"external_min" integer DEFAULT 0 NOT NULL,
	"external_max" integer DEFAULT 0 NOT NULL,
	"weeks_min" integer DEFAULT 0 NOT NULL,
	"weeks_max" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"is_range" boolean DEFAULT false NOT NULL,
	"range_low" integer DEFAULT 0 NOT NULL,
	"range_high" integer DEFAULT 0 NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"help" text DEFAULT '' NOT NULL,
	"select" text DEFAULT 'one' NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_key" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"mode" text DEFAULT 'flat' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"monthly" integer DEFAULT 0 NOT NULL,
	"external_min" integer DEFAULT 0 NOT NULL,
	"external_max" integer DEFAULT 0 NOT NULL,
	"weeks" integer DEFAULT 0 NOT NULL,
	"weeks_factor" integer DEFAULT 10000 NOT NULL,
	"requires" text DEFAULT '[]' NOT NULL,
	"conflicts" text DEFAULT '[]' NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'project' NOT NULL,
	"base_price" integer DEFAULT 0 NOT NULL,
	"minimum_price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"weeks_min" integer DEFAULT 0 NOT NULL,
	"weeks_max" integer DEFAULT 0 NOT NULL,
	"includes" text DEFAULT '[]' NOT NULL,
	"groups" text DEFAULT '[]' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "estimates_public_id_idx" ON "estimates" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "estimates_created_idx" ON "estimates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "estimates_status_idx" ON "estimates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "pricing_groups_key_idx" ON "pricing_groups" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "pricing_options_group_key_idx" ON "pricing_options" USING btree ("group_key","key");--> statement-breakpoint
CREATE INDEX "pricing_options_group_idx" ON "pricing_options" USING btree ("group_key");--> statement-breakpoint
CREATE UNIQUE INDEX "service_catalog_slug_idx" ON "service_catalog" USING btree ("slug");