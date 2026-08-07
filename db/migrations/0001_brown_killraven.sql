CREATE TABLE `gold_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`habit_id` text,
	`mission_id` text,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`difficulty` text NOT NULL,
	`xp_reward` integer NOT NULL,
	`gold_reward` integer NOT NULL,
	`status` text DEFAULT 'ativa' NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `check_ins` ADD `gold_awarded` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_closures` ADD `relapsed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_closures` ADD `gold_change` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `gold` integer DEFAULT 0 NOT NULL;