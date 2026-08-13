ALTER TABLE "users" ADD COLUMN "google_access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_token_expires_at" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_classroom_sync_at" text;