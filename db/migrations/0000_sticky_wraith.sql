CREATE TABLE `check_ins` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`user_id` text NOT NULL,
	`checkin_date` text NOT NULL,
	`created_at` text NOT NULL,
	`xp_awarded` integer NOT NULL,
	`streak_at_checkin` integer NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `check_ins_habit_date_unique` ON `check_ins` (`habit_id`,`checkin_date`);--> statement-breakpoint
CREATE TABLE `class_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`old_class` text,
	`new_class` text NOT NULL,
	`xp_cost` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `daily_closures` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`closure_date` text NOT NULL,
	`perfect_day` integer DEFAULT false NOT NULL,
	`xp_change` integer DEFAULT 0 NOT NULL,
	`hp_change` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_closures_user_date_unique` ON `daily_closures` (`user_id`,`closure_date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`difficulty` text NOT NULL,
	`frequency` text DEFAULT 'diaria' NOT NULL,
	`custom_days` text,
	`status` text DEFAULT 'ativo' NOT NULL,
	`paused_from` text,
	`paused_until` text,
	`streak_count` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`habit_id` text,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`hp_after` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `shield_uses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`habit_id` text,
	`week_start` text NOT NULL,
	`target_type` text NOT NULL,
	`protected_date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shield_uses_user_week_unique` ON `shield_uses` (`user_id`,`week_start`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`timezone` text DEFAULT 'America/Sao_Paulo' NOT NULL,
	`player_class` text,
	`level` integer DEFAULT 1 NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`hp` integer DEFAULT 100 NOT NULL,
	`class_chosen_at` text,
	`last_class_change_at` text,
	`shields_remaining` integer DEFAULT 1 NOT NULL,
	`shield_week_start` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`habit_id` text,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE set null
);
