ALTER TABLE "messages" ADD COLUMN "company" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "service" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tier" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "budget" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "timeline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "preferred_contact" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "status" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");