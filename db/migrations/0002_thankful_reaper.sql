CREATE TABLE `grimoire_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`summary` text NOT NULL,
	`quiz` text NOT NULL,
	`answers` text NOT NULL,
	`status` text DEFAULT 'gerado' NOT NULL,
	`correct_count` integer,
	`xp_awarded` integer,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
