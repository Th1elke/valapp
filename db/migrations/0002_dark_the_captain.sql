ALTER TABLE "missions" ALTER COLUMN "difficulty" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ALTER COLUMN "xp_reward" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ALTER COLUMN "gold_reward" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "external_id" text;